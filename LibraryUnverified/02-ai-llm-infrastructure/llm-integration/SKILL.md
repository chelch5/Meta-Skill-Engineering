---
name: llm-integration
description: Integrate LLM capabilities into applications with explicit runtime boundaries, structured schemas, cost controls, and evaluation plans. Triggers on tasks involving model inference APIs, prompt engineering systems, LLM toolchain setup, or AI agent runtime design. Does not trigger on ordinary software tasks without model, inference, evaluation, or agent-runtime concerns.
license: Apache-2.0
compatibility:
  clients: [openai-codex, gemini-cli, opencode]
metadata:
  owner: codex
  domain: llm-integration
  maturity: draft
  risk: low
  tags: [llm, integration]
---

# Purpose

Integrate LLM capabilities into applications with explicit runtime boundaries, structured schemas, cost controls, and evaluation plans.

# When to use

Use this skill when the task involves:

- **Model inference integration**: Connecting to OpenAI, Anthropic, Google, or other LLM APIs
- **Prompt engineering systems**: Designing structured prompts with variables, templates, or chaining
- **LLM toolchain setup**: Installing and configuring SDKs like Vercel AI SDK, LangChain, or LlamaIndex
- **AI agent runtime design**: Building systems with tool calling, structured output, or multi-step reasoning
- **Evaluation frameworks**: Creating test cases, benchmarks, or quality gates for LLM outputs

Look for these signals in the request or codebase:
- Keywords: "LLM", "model API", "prompt template", "inference", "token cost", "agent runtime"
- File patterns: Files importing `openai`, `@ai-sdk`, `langchain`, `transformers`, or similar
- Configuration: API key management, model selection logic, temperature/top-p settings

# When NOT to use

Do not use this skill when:

- The task is ordinary software development without model, inference, or agent-runtime concerns (e.g., CSS fixes, database schema changes, API endpoint logic)
- The task is specifically about local LLM deployment or Ollama setup (use `local-llm` or `ollama` instead)
- The runtime or framework is already covered by a more specific active skill (e.g., `ai-sdk` for Vercel AI SDK specific tasks)
- The request is about general AI/ML research without integration or production concerns

# Procedure

1. **Clarify the integration goal**
   - Identify which model provider or runtime will be used (OpenAI, Anthropic, Google, local, etc.)
   - Define the interface boundary: synchronous API calls, streaming, async workers, or embedded inference
   - List the specific capabilities needed: text generation, embeddings, tool calling, structured output, image/audio input

2. **Define schemas and contracts**
   - Document the input/output schemas for each LLM interaction point
   - Write explicit prompt templates with variable placeholders clearly marked
   - Specify tool definitions with name, description, and parameter schemas
   - Define the expected response format (raw text, JSON, function call, or stream chunks)

3. **Implement cost and safety controls**
   - Set maximum token limits for both input and output
   - Configure timeout thresholds appropriate to the use case (e.g., 30s for user-facing, 5min for batch)
   - Add retry logic with exponential backoff for transient failures
   - Implement circuit breaker patterns for provider outages
   - Log token usage per request for cost tracking

4. **Build evaluation plan**
   - Create representative test cases covering normal, edge, and failure scenarios
   - Define quality metrics appropriate to the task (accuracy, latency, cost per request)
   - Set minimum acceptance thresholds before production deployment
   - Document known failure modes and how the system handles them

5. **Document tradeoffs and next steps**
   - Record the quality/latency/cost tradeoffs chosen and why
   - List follow-up experiments or improvements needed
   - Identify monitoring and alerting requirements for production

# Output contract

Produce these deliverables:

1. **Runtime Context**: Model provider, API version, authentication method, and environment configuration
2. **Interfaces and Schemas**: Prompt templates, input/output schemas, tool definitions, and example requests/responses
3. **Safety or Cost Controls**: Token limits, timeout settings, retry policy, circuit breaker config, and cost estimates
4. **Evaluation Plan**: Test cases, quality metrics, acceptance thresholds, and known failure modes

# Failure handling

**Ambiguous scope detected**
- Symptom: Request mentions "AI" or "model" but lacks specific runtime or integration details
- Action: Ask clarifying questions to determine if this is model inference integration, training, or generic AI discussion. If generic, redirect to appropriate skill or decline.

**Weak or missing evidence**
- Symptom: No API keys, SDK imports, or configuration files found; request is conceptual only
- Action: State uncertainty explicitly. Produce a design document only, not implementation. Suggest prerequisites (API key setup, SDK installation) before proceeding.

**Provider-specific requirements emerge**
- Symptom: Task focuses on Ollama, local model deployment, or specific framework (LangChain, LlamaIndex)
- Action: Redirect to the more specific skill (`local-llm`, `ollama`, or framework-specific skill) rather than stretching this one.

**Cost or latency constraints violated**
- Symptom: Proposed solution exceeds reasonable budgets (e.g., >$1 per request, >30s latency for real-time use)
- Action: Flag the violation explicitly. Propose alternatives: smaller model, caching, request batching, or asynchronous processing.

**Schema validation failures**
- Symptom: LLM outputs don't match expected structured format (JSON, function call)
- Action: Implement retry with schema validation, add response parsing error handling, or switch to provider's structured output mode if available.

# Next steps

After completing this skill:

- For local deployment or Ollama-specific setup, use `local-llm` or `ollama`
- For Vercel AI SDK specific implementation details, use `ai-sdk`
- For production deployment concerns, consider infrastructure or DevOps skills
- For ongoing monitoring and evaluation, return to this skill's Evaluation Plan section

# References

Read these only when relevant:

- `references/runtime-contracts.md` — System boundaries and contract patterns
- `references/eval-cases.md` — Test case design patterns
- `references/risk-controls.md` — Safety and cost control templates

# Related skills

- `local-llm` — For local model deployment without external APIs
- `ollama` — For Ollama-specific setup and configuration
- `ai-sdk` — For Vercel AI SDK implementation details
