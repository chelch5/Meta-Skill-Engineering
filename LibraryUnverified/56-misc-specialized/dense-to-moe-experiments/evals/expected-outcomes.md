# Expected Outcomes

A good Dense-to-MoE Experiments run should:

- Trigger only when the task explicitly involves dense-to-MoE conversion, FFN upcycling, expert initialization, router implementation, or MoE continued pretraining
- Produce a response that includes all elements of the Output Contract:
  - **Runtime Context** — Model specs, compute resources, token budget
  - **Interfaces and Schemas** — Router implementation, loss functions, checkpoint formats
  - **Safety or Cost Controls** — Expert utilization monitoring, dead expert detection, overflow handling
  - **Evaluation Plan** — Baseline comparison methodology, metrics, success criteria
  - **Configuration details** — Architecture spec, initialization config, router config
  - **Training and comparison artifacts** — Training log, comparison report
- Stay within the MoE upcycling workflow instead of drifting into generic ML advice
- Call out uncertainty and next validation step explicitly when evidence is incomplete (e.g., "Need to verify checkpoint availability before proceeding to step 2")
- Avoid fabricating implementation details, paper citations, or performance numbers not grounded in the provided context
- Include specific decision rules (top-2 default, α=0.01, split+perturb recommended) rather than presenting all options equally
- Provide concrete validation checkpoints after each major procedure step
