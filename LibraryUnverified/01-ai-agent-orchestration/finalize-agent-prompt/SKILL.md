---
name: finalize-agent-prompt
description: 'Polish and finalize an AI agent prompt file by refining structure, wording, and clarity to match proven best practices while preserving the original intent and markdown frontmatter.'
---

# Finalize Agent Prompt

## Purpose

Polish and finalize an AI agent prompt file by applying proven best practices to its structure, wording, and organization. This skill acts as an experienced prompt engineer who refines prompts based on patterns that have shown successful outcomes.

## When to use

- After drafting a new agent prompt and before sharing or deploying it
- When reviewing an existing prompt that feels unclear, verbose, or unfocused
- When feedback indicates a prompt produces inconsistent or off-target results
- To align a prompt with established formatting and structural conventions

## When NOT to use

- When the user has not yet provided the prompt file to be finalized
- For non-prompt files (documentation, code, configuration files)
- When the user wants to rewrite the prompt with different requirements or scope changes
- For quick proofreading of general documents without prompt-specific concerns
- When the user explicitly wants minimal changes or only specific line edits

## Procedure

1. **Verify file availability**
   - Confirm the user has provided a prompt file (SKILL.md or similar markdown with frontmatter)
   - If no file is provided, ask for it and halt until received

2. **Read and analyze the prompt**
   - Parse the frontmatter (name, description, other metadata)
   - Identify the core purpose and target audience
   - Note the current structure and organization
   - Mark sections that feel unclear, verbose, or off-target

3. **Apply best-practice refinements**
   - **Structure**: Ensure logical section ordering (Purpose → When to use → Procedure → Output → Failure handling → Next steps)
   - **Clarity**: Replace vague language with precise, actionable instructions
   - **Brevity**: Remove redundant explanations; keep what serves the user
   - **Tone**: Maintain a direct, task-focused voice appropriate for agent consumption
   - **Formatting**: Preserve markdown frontmatter, encoding, and basic structure

4. **Correct mechanical issues**
   - Fix spelling and grammar errors
   - Ensure consistent heading hierarchy
   - Verify code blocks, lists, and formatting are intact

5. **Preserve original intent**
   - Do not change the prompt's core functionality or scope
   - Do not remove domain-specific substance or technical requirements
   - Do not add unrelated features or suggestions

6. **Present the finalized version**
   - Output the complete, polished prompt file
   - Highlight the 2-3 most significant improvements if helpful
   - Confirm the finalization is complete and ready for use

## Output contract

- The output is a complete, polished prompt file with preserved frontmatter
- Structure follows established conventions where applicable
- Wording is clearer and more actionable than the original
- Spelling and grammar are corrected
- Original intent and domain substance are fully preserved
- Ready for immediate use or further deployment

## Failure handling

- **No file provided**: Ask the user to share the prompt file and wait for it
- **File is not a prompt**: Clarify this skill is specifically for agent prompt files; suggest alternatives if needed
- **Ambiguous scope**: If unclear what constitutes an improvement, ask the user for 1-2 priority areas to focus on
- **Major structural issues**: If the prompt lacks essential sections (like Purpose or Procedure), note the gaps and propose a minimally invasive fix rather than a full rewrite
- **User requests scope change**: Decline politely and clarify that this skill preserves original intent; suggest using a skill-creator approach for new requirements

## Next steps

- If the finalized prompt needs safety review before deployment, use `skill-safety-review`
- If the prompt is part of a larger skill package, continue with `skill-packaging`
- If evaluating whether the refined prompt improves outcomes, use `skill-evaluation`

## References

- AGENTS.md in this repository for SKILL.md structure conventions
- Proven prompt patterns observed across successful agent skill packages
