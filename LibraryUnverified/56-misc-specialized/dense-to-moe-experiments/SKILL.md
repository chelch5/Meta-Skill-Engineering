---
name: dense-to-moe-experiments
description: Convert dense transformer models to Mixture-of-Experts (MoE) architectures via FFN upcycling, expert initialization strategies, and router training with load-balancing loss. Triggers on dense-to-MoE conversion, FFN upcycling, expert routing implementation, or MoE continued pretraining tasks.
license: Apache-2.0
compatibility:
  clients: [openai-codex, gemini-cli, opencode]
metadata:
  owner: codex
  domain: dense-to-moe-experiments
  maturity: draft
  risk: medium
  tags: [moe, mixture-of-experts, upcycling, routing, sparsity]
---

# Purpose

Guides the experimental conversion of dense transformer models into Mixture-of-Experts (MoE) architectures. Covers FFN layer splitting into multiple experts, initialization strategies, router/gating mechanism design, load balancing, continued pretraining schedules, and evaluation methodology for comparing MoE vs. dense baselines at equivalent active parameter counts.

# When to use

Use this skill when:

- Upcycling a dense model's FFN layers into N experts per transformer block (Mixtral-style)
- Choosing expert initialization strategy (copy, split+perturb, random, or cluster-based)
- Implementing or tuning router/gating networks (top-1, top-2, expert choice, hash-based routing)
- Adding auxiliary load-balancing losses to prevent expert collapse (GShard, Switch Transformer patterns)
- Designing continued pretraining schedules after MoE upcycling
- Comparing dense baselines vs. MoE variants with matched active parameters and FLOPs

# When NOT to use

- Training a dense model from scratch (use `pretraining-pipeline`)
- Optimizing MoE inference serving (use `serving-architecture`)
- Model distillation or compression tasks (use `distillation-compression`)
- Infrastructure setup for training (use `training-infrastructure`)

# Procedure

## 1. Select source model and target MoE configuration

Define the target architecture:
- Number of experts per layer (typically 8, 16, or 64)
- Experts activated per token (top-k, typically k=2)
- Which layers to convert (usually all FFN layers, sometimes alternating)

Document total params vs. active params. Example: 8 experts with top-2 routing means 4x total params but same active FLOPs per token.

**Validation checkpoint:** Confirm the dense source model has saved checkpoints available and document baseline eval metrics before upcycling.

## 2. Initialize experts from dense FFN weights

Choose and implement one initialization strategy:

| Strategy | Method | When to use |
|----------|--------|-------------|
| **Copy** | Duplicate dense FFN weights to all N experts identically | Simplest baseline; router training breaks symmetry |
| **Split + perturb** | Copy weights, add Gaussian noise (σ=0.01–0.02) per expert | **Recommended default** — faster differentiation |
| **Random subset** | Random subset of dense FFN neurons per expert | Better diversity but larger initial quality drop |
| **Cluster-based** | Cluster hidden representations, assign by cluster | Most principled but highest complexity |

**Validation checkpoint:** Verify all experts produce non-identical outputs on a sample batch before router training begins.

## 3. Implement router/gating mechanism

Implement the learned linear projection producing logits per token:

```python
# Router is W_gate ∈ R^{d_model × num_experts}
gate_logits = x @ W_gate  # (batch*seq, num_experts)
topk_vals, topk_idx = torch.topk(gate_logits, k=2)
weights = F.softmax(topk_vals, dim=-1)
```

Consider alternatives based on constraints:
- **Top-k routing** (default): Tokens select top-k experts
- **Expert-choice routing**: Experts select tokens (better load balancing)
- **Hash-based routing**: Deterministic, no learned parameters (lowest overhead)
- **Soft-MoE**: Continuous mixing (no discrete selection)

**Decision rule:** Use top-2 routing as default. Top-1 is prone to expert collapse; top-4+ adds overhead with diminishing returns.

## 4. Add load-balancing loss

Implement auxiliary loss to prevent expert collapse. Without balancing, routers tend to use only 1–2 experts.

**GShard-style loss (recommended default):**
```
L_aux = α * N * Σ(f_i * P_i)
```
Where f_i = fraction of tokens routed to expert i, P_i = mean gate probability for expert i. Set α=0.01 initially; increase to 0.1 only if expert utilization entropy drops below 50% of uniform.

**Additional stabilization losses:**
- **Switch Transformer**: Simplified differentiable load balance with capacity factor C=1.25
- **Z-loss**: Penalize large logits: `L_z = β * mean(logsumexp(gate_logits)^2)`, β=0.001

**Validation checkpoint:** Monitor expert utilization — all experts should receive 0.8/N to 1.2/N fraction of tokens. If any expert receives <5% of fair share after 5B tokens, increase α or investigate dead experts.

## 5. Continue pretraining

After upcycling, train on 50B–200B tokens (5–20% of original pretraining budget):

- Use lower learning rate: 0.1–0.3x original peak LR
- Include warmup period
- The router needs 1B–5B tokens to stabilize routing patterns
- Monitor per-expert utilization every 1B tokens
- Track downstream eval metrics every 1B tokens

**Validation checkpoint:** Router routing patterns should stabilize (measured by <5% change in expert assignment distribution between consecutive checkpoints).

## 6. Evaluate against dense baseline

Compare on matched active parameters (not total params):

| Metric | Target |
|--------|--------|
| Eval loss | Match or beat dense baseline |
| Downstream benchmarks | MMLU, HumanEval, GSM8K with confidence intervals |
| Expert utilization entropy | >50% of uniform distribution |
| Routing stability | <10% tokens change expert assignment between checkpoints |
| Wall-clock time | Document training/inference overhead |

**Decision rule:** MoE models should match or exceed dense baseline quality at the same active-param count within 100B continued-pretraining tokens. If not, revisit initialization and routing.

# Output contract

When executing this skill, produce:

1. **Runtime Context** — Source model, target MoE config, compute resources, token budget
2. **Interfaces and Schemas** — Router implementation details, loss functions, checkpoint formats
3. **Safety or Cost Controls** — Expert utilization monitoring, dead expert detection, overflow handling
4. **Evaluation Plan** — Baseline comparison methodology, metrics to track, success criteria
5. **Architecture spec** — Num experts, top-k, layers converted, total vs. active params, FLOP comparison
6. **Initialization config** — Strategy used, perturbation scale, weight mapping
7. **Router config** — Gating type, auxiliary loss formulation, capacity factor, loss coefficients
8. **Training log** — Loss curves, expert utilization histograms per checkpoint, routing stability metrics
9. **Comparison report** — Dense vs. MoE results on matched benchmarks with confidence intervals

# Failure handling

## Expert utilization collapse (>80% of tokens to ≤2 experts)

**Diagnostic steps:**
1. Check current auxiliary loss coefficient α
2. Verify router gradients are non-zero and flowing
3. Inspect expert utilization histogram per layer

**Resolution:**
- Increase auxiliary loss α by 5x (e.g., 0.01 → 0.05)
- Restart from last balanced checkpoint
- If persists, consider expert-choice routing instead of top-k

## Loss spikes during continued pretraining

**Diagnostic steps:**
1. Check if spike correlates with learning rate warmup end
2. Verify gradient norms are not exploding
3. Inspect per-expert loss contributions

**Resolution:**
- Reduce learning rate by 50%
- Add gradient clipping at 1.0
- If spike occurs at same checkpoint consistently, verify data quality at that step

## MoE underperforms dense baseline after 100B tokens

**Diagnostic steps:**
1. Verify initialization correctness — check expert weight distributions match expected
2. Confirm router gradients are non-zero throughout training
3. Compare eval curves — is MoE improving slower or plateauing lower?
4. Check that comparison uses active params, not total params

**Resolution:**
- Revisit initialization strategy (try split+perturb if using plain copy)
- Inspect for dead experts and apply utilization collapse fixes
- Consider reducing expert count or switching to expert-choice routing

## All-to-all communication dominates training time

**Diagnostic steps:**
1. Profile communication vs. computation time per step
2. Check expert parallelism configuration
3. Verify GPU topology and NVLink connectivity

**Resolution:**
- Implement expert-choice routing (reduces communication)
- Reduce expert count per layer
- Use MegaBlocks or Fairseq MoE optimized kernels
- Consider gradient checkpointing to reduce memory pressure

# Next steps

After completing dense-to-MoE conversion:

- For deploying MoE models with expert parallelism, use `serving-architecture`
- For distributed training infrastructure (expert parallelism, all-to-all communication), use `training-infrastructure`
- For distilling MoE back to dense for inference efficiency, use `distillation-compression`
- For general transformer architecture decisions, use `model-architecture`

# References

- Mixtral of Experts: Jiang et al. "Mixtral of Experts" (Mixtral-8x7B architecture)
- Switch Transformer: Fedus et al. "Switch Transformers: Scaling to Trillion Parameter Models"
- GShard: Lepikhin et al. "GShard: Scaling Giant Models with Conditional Computation"
- ST-MoE: Zoph et al. "ST-MoE: Designing Stable and Transferable Sparse Expert Models"
- MegaBlocks: Efficient MoE training library `github.com/databricks/megablocks`
- Fairseq MoE: `github.com/facebookresearch/fairseq/tree/main/examples/moe`

# Related skills

- `serving-architecture` — Deploying MoE models with expert parallelism
- `training-infrastructure` — Distributed training setup for MoE (expert parallelism, all-to-all communication)
- `distillation-compression` — Distilling MoE back to dense for inference efficiency
- `model-architecture` — General transformer architecture decisions
