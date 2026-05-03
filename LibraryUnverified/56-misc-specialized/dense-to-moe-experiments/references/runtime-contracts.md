# Runtime Contracts

Treat Dense-to-MoE Experiments as a structured system with explicit boundaries and checkpoints.

## Required Context

Before beginning any dense-to-MoE conversion:

- **Source model checkpoint** — Dense baseline weights, architecture config, baseline eval metrics
- **Target MoE specification** — Number of experts per layer, top-k value, layers to convert
- **Compute resources** — GPU count, memory per GPU, NVLink topology, expected training time
- **Token budget** — Available tokens for continued pretraining (50B–200B typical)

## Interfaces and Schemas

**Router Interface:**
- Input: Hidden states `x ∈ R^{batch*seq × d_model}`
- Output: Expert indices `topk_idx ∈ Z^{batch*seq × k}`, gate weights `weights ∈ R^{batch*seq × k}`

**Loss Components:**
- Primary loss: Standard language modeling loss
- Auxiliary loss: Load-balancing loss (GShard or Switch Transformer style)
- Optional: Z-loss for logit stabilization

**Checkpoint Schema:**
- Must preserve both dense source and MoE target weights for rollback
- Include expert utilization histograms per checkpoint
- Track routing stability metrics between checkpoints

## Cost and Latency Budgets

- All-to-all communication should not exceed 30% of step time
- Expert capacity factor C=1.25 provides 25% overflow buffer
- Gradient checkpointing recommended for models >20B active params

## Fallback Behavior

- If expert utilization collapses: Increase auxiliary loss α, restart from balanced checkpoint
- If loss spikes: Reduce LR by 50%, add gradient clipping at 1.0
- If MoE underperforms after 100B tokens: Verify initialization, check router gradients

## Refusal Handling

Refuse to proceed when:
- Source dense model checkpoint is unavailable
- Token budget is insufficient for continued pretraining (<50B tokens)
- Compute resources cannot support target MoE configuration
- User requests optimization for production serving (out of scope — use `serving-architecture`)

## Related Skills

- `serving-architecture` — For production MoE deployment concerns
- `training-infrastructure` — For distributed setup and expert parallelism
- `distillation-compression` — For distilling MoE back to dense
