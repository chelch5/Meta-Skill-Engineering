# Contributing to Meta-Skill-Engineering

Thank you for your interest in contributing to the Meta Skill Studio project.

## Getting Started

1. Clone the repository
2. Read `AGENTS.md` for working rules and skill package conventions
3. Install Node.js, Rust, and the Tauri prerequisites for your operating system

## Skill Package Structure

Every skill package must contain a `SKILL.md` file following the structure defined in `AGENTS.md`:

1. YAML frontmatter (name, description)
2. Purpose
3. When to use / When NOT to use
4. Procedure
5. Output contract
6. Failure handling
7. Next steps
8. References (optional)

## Building the Desktop App

Use `npm run build` and `cargo check` from `src-tauri/` for local desktop validation.

## Conventions

- Keep documentation factual and direct
- Follow existing TypeScript, Rust, and skill-package style
- Run `npm run build`, `cargo check`, and the relevant skill/eval validation before submitting changes
- Update `CHANGELOG.md` for user-facing changes

## Reporting Issues

Open an issue on GitHub with a clear description, steps to reproduce, and expected vs actual behavior.
