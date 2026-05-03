---
name: pretraining-pipeline
description: Build end-to-end LLM pretraining pipelines from scratch. Use when configuring distributed training with FSDP/DeepSpeed ZeRO, implementing learning rate schedules (warmup + cosine decay), setting up gradient accumulation, designing checkpointing strategies, or monitoring training metrics (loss, MFU, gradient norms). Triggers on requests for accelerate configs, deepspeed JSON configs, torch.distributed training loops, or training monitoring dashboards. Do not use for fine-tuning existing models, inference serving, model architecture design, or tokenizer training.
license: Apache-2.0
compatibility:
  clients: [openai-codex, gemini-cli, opencode]
metadata:
  owner: codex
  domain: pretraining-pipeline
  maturity: draft
  risk: low
  tags: [pretraining, distributed, deepspeed, fsdp, accelerate]
---

# Purpose

Build end-to-end LLM pretraining pipelines covering tokenized data loading, distributed training configuration (FSDP/DeepSpeed), learning rate scheduling, gradient accumulation, checkpointing strategy, and training monitoring using accelerate, deepspeed, torch.distributed, and wandb.

# When to use

Use this skill when the task involves:

- Setting up distributed training configurations (accelerate, DeepSpeed, torch.distributed)
- Implementing learning rate schedules with warmup and decay for pretraining
- Configuring gradient accumulation and computing effective batch sizes
- Designing checkpointing strategies with async saving and resume capability
- Setting up training monitoring (wandb, tensorboard) for loss curves and throughput metrics
- Troubleshooting training instabilities (loss spikes, OOM, gradient explosions)

## Trigger phrases

- "set up accelerate config for pretraining"
- "configure DeepSpeed ZeRO for 7B model"
- "implement warmup + cosine decay LR schedule"
- "design checkpointing strategy for multi-day training"
- "monitor MFU and gradient norms during training"
- "distributed training loop for LLM pretraining"
- "compute effective batch size for 2M tokens"

# When NOT to use

Do not use this skill when:

- Fine-tuning or applying LoRA to an existing model → use `fine-tuning`
- Inference serving, API deployment, or model hosting → use `serving-architecture`
- Designing model architecture (layers, attention mechanisms, activations) → use `model-architecture`
- Training tokenizers or designing vocabularies → use `tokenizer-design`
- Writing data preprocessing scripts without training configuration → use `data-pipeline`

## Boundary examples

- "How do I pretrain a 7B model from scratch on my dataset?" → USE this skill
- "How do I fine-tune Llama-3-8B on my domain?" → do NOT use (use `fine-tuning`)
- "Design a transformer architecture with sliding window attention" → do NOT use (use `model-architecture`)

# Procedure

## 1. Prepare tokenized data

Deliverables: data pipeline specification document

- Tokenize corpus offline into packed binary shards
- Use `datasets.load_dataset("path", streaming=True)` for datasets >100GB
- Pack sequences to `max_seq_length` with `<eos>` separators to avoid padding waste
- Store as memory-mapped files or webdataset `.tar` shards for efficient streaming
- Validate: verify shard integrity, sequence length distribution, token count matches expected corpus size

## 2. Configure distributed strategy

Deliverables: complete configuration file(s) for chosen strategy

**Decision matrix:**

| Strategy | Shards | Use When | Config Location |
|----------|--------|----------|-----------------|
| FSDP | params, grads, optimizer states | PyTorch-native, <70B models | Python code or `accelerate config` |
| DeepSpeed ZeRO-1 | optimizer states only | Model fits on single GPU | `ds_config.json` |
| DeepSpeed ZeRO-2 | optimizer states + gradients | Best memory/speed balance | `ds_config.json` |
| DeepSpeed ZeRO-3 | all including parameters | Model exceeds single GPU VRAM | `ds_config.json` |
| ZeRO-3 + offload | all + CPU/NVMe offload | Extreme memory constraints | `ds_config.json` with offload settings |

For multi-node training with models >70B: combine data parallelism with tensor parallelism (Megatron-style or FSDP hybrid sharding).

## 3. Set learning rate schedule

Deliverables: LR schedule configuration with explicit values

Standard configuration:
- Warmup: linear ramp over 2000 steps to peak LR
- Decay: cosine decay to `min_lr = peak_lr * 0.1`
- Peak LR by model size: ~3e-4 (1B), ~1.5e-4 (7B), ~1e-4 (13B+)
- Optimizer: AdamW with `betas=(0.9, 0.95)`, `weight_decay=0.1`

Validate: plot LR curve, verify warmup duration is <5% of total steps, min_lr is reachable before training ends.

## 4. Configure gradient accumulation

Deliverables: batch size calculation with verification

Formula: `effective_batch_size = per_gpu_batch * num_gpus * grad_accum_steps`

Target: 2M-4M tokens per update (sequence_length × effective_batch_size)

Example calculation:
```
8 GPUs × 4 per-device batch × 32 accum steps × 2048 seq_len = 2,097,152 tokens
```

Validate: confirm effective batch size matches Chinchilla-optimal for token budget and model size.

## 5. Set checkpointing strategy

Deliverables: checkpoint configuration with retention policy

Configuration:
- Frequency: every 500-1000 steps (or every 30-60 minutes)
- Method: async saving via `torch.distributed.checkpoint` or DeepSpeed async
- Retention: keep last 3-5 checkpoints + milestone saves (every 10% of training)
- Contents: model weights, optimizer state, RNG state, training step counter

Validate: test save/resume round-trip, verify loss consistency pre/post resume, confirm optimizer state restoration.

## 6. Configure monitoring

Deliverables: monitoring dashboard specification

Log to wandb or tensorboard:
- `training_loss` — primary optimization target
- `gradient_norm` — stability indicator (alert if >10.0)
- `learning_rate` — verify schedule execution
- `tokens_per_second` — throughput metric
- `MFU` (Model FLOPs Utilization) — efficiency metric (target >40% on A100)

Set `max_grad_norm=1.0` for gradient clipping. Alert when loss exceeds 2× rolling average.

## 7. Validate pipeline

Deliverables: validation report

Run 100-step smoke test before full training. Verify:
- [ ] Loss decreases monotonically (excluding normal noise)
- [ ] Gradient norms remain stable in 0.1-10.0 range
- [ ] LR schedule executes as configured
- [ ] Checkpoint save completes without error
- [ ] Checkpoint resume produces identical loss to pre-save
- [ ] Throughput (tokens/sec) meets target
- [ ] No OOM errors during peak memory usage

# Decision rules

- Use FSDP for PyTorch-native workflows; use DeepSpeed for maximum memory efficiency or when ZeRO-3 offloading to CPU/NVMe is needed
- ZeRO-2 is the default for models that fit in aggregate GPU memory; ZeRO-3 only when model params alone exceed total GPU VRAM
- Activation checkpointing (`gradient_checkpointing=True`) trades ~30% speed for ~50% memory reduction — enable for memory-constrained setups
- Batch size ramp: start at 1/4 target batch size for first 5% of training, then ramp to full. Stabilizes early training.
- If MFU < 40% on A100s, investigate data loading bottlenecks, communication overhead, or kernel inefficiency
- For runs >1 day, log to persistent storage (wandb, tensorboard on shared FS) — never rely only on stdout

# Output requirements

1. `Training Config` — Complete accelerate/deepspeed config with all parallelism, batch size, LR, and optimizer settings
2. `Data Pipeline Spec` — Tokenization format, shard layout, sequence packing strategy, and streaming config
3. `Compute Plan` — GPU count, expected training time, tokens/second target, MFU target, total token budget
4. `Monitoring Dashboard` — wandb project setup with tracked metrics: loss, grad norm, LR, throughput, MFU

# References

- DeepSpeed ZeRO: Rajbhandari et al., "ZeRO: Memory Optimizations Toward Training Trillion Parameter Models" (arxiv 1910.02054)
- PyTorch FSDP: https://pytorch.org/docs/stable/fsdp.html
- Hoffmann et al., "Training Compute-Optimal Large Language Models" — Chinchilla scaling laws (arxiv 2203.15556)
- HuggingFace Accelerate: https://huggingface.co/docs/accelerate
- Weights & Biases: https://docs.wandb.ai

# Related skills

- `model-architecture` — defines the model structure this pipeline trains
- `tokenizer-design` — produces the tokenizer and vocab used in data preparation
- `moe-architecture` — MoE models require expert parallelism in addition to data/tensor parallelism
- `training-infrastructure` — hardware provisioning and cluster setup for pretraining

# Failure handling

## Loss spikes

Symptom: training_loss >3× rolling average over 100 steps.

Recovery:
1. Immediately pause training
2. Reduce learning rate by 50%: `new_lr = current_lr * 0.5`
3. Resume from last stable checkpoint (prior to spike onset)
4. If spike persists after resume: inspect recent data shards for corruption, check for mixed-precision overflow

Prevention: implement gradient clipping at 1.0, use loss scaling with FP16/BF16, validate data shards before training.

## Gradient explosion

Symptom: gradient_norm >100 or NaN gradients detected.

Recovery:
1. Verify `max_grad_norm` clipping is active in training config
2. If clipping is active but ineffective: reduce LR by 25% or reduce per-device batch size
3. Check input data for NaN or inf values: `torch.isnan(input).any()`
4. Resume from checkpoint before explosion

Prevention: enable loss scaling with dynamic scaling for FP16, add gradient clipping to config if missing.

## Out-of-memory (OOM)

Symptom: CUDA OOM error or process killed by OOM killer.

Recovery (apply in order until resolved):
1. Enable activation checkpointing: `gradient_checkpointing=True` in model config (~30% speed reduction, ~50% memory savings)
2. Reduce per-device batch size by 50%
3. Increase ZeRO stage (1→2→3) or enable CPU/NVMe offloading for ZeRO-3
4. For FSDP: use `ShardingStrategy.SHARD_GRAD_OP` instead of `FULL_SHARD`
5. Reduce sequence length temporarily during debugging

Prevention: memory profile with `torch.cuda.memory_summary()` before full training, set conservative initial batch sizes.

## Checkpoint resume failure

Symptom: loss after resume differs significantly from pre-save, or training starts from step 0.

Recovery:
1. Verify checkpoint directory contains: `pytorch_model.bin`, optimizer state file, `rng_state.pth`, `trainer_state.json`
2. For DeepSpeed: confirm `load_checkpoint()` returns success and loaded global step matches expected
3. Check RNG state restoration: compare loss on same batch pre/post resume
4. If optimizer state missing: resume with fresh optimizer (accepts some training regression) or restart from earlier checkpoint

Prevention: test checkpoint round-trip during smoke test, implement atomic checkpoint writes (write to temp, rename on success).

## Throughput degradation

Symptom: MFU <40% on A100, or tokens/sec drops >20% from baseline.

Diagnostics:
1. Check GPU utilization: `nvidia-smi dmon` — look for thermal throttling (PWR cap)
2. Profile data loading: measure time between `__getitem__` calls in dataloader
3. Check network bandwidth (multi-node): `ib_write_bw` or `iperf` between nodes
4. Verify no CPU bottleneck: `htop` during training, ensure num_workers >0 in DataLoader

Recovery:
- Data loading bottleneck: increase `num_workers`, pin_memory=True, prefetch_factor=2
- Network bottleneck: enable NCCL tuning (`NCCL_IB_DISABLE=0`, `NCCL_P2P_DISABLE=0`)
- Thermal throttling: reduce power limit temporarily, improve cooling
- Persistent degradation: scale to more nodes with smaller per-node batch

## Data loading stalls

Symptom: periodic GPU idle periods (>1 second with 0% utilization).

Recovery:
1. Increase DataLoader `num_workers` (typically 4-8 for SSD, 2-4 for network storage)
2. Enable `pin_memory=True` for faster CPU→GPU transfers
3. Pre-shuffle and cache small datasets, use streaming for large datasets
4. Switch to WebDataset format for sequential read performance
5. For cloud storage: enable local caching or use faster storage tier

Prevention: benchmark dataloader throughput independently: `time python -c "for batch in dataloader: pass"`
