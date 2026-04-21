# Prompts — versioned as code

Each prompt lives in a versioned YAML file. The file is the single source of
truth for a given prompt version: the model, the system message, the user
template, and the expected output schema.

## Layout

```
prompts/
├── generator/
│   ├── v1.yaml           # Current generator prompt
│   └── v0-draft.yaml     # Older version kept for traceability
├── tuner/
│   └── v1.yaml
├── filter/
│   └── v1.yaml
├── evals/
│   ├── canary/           # Fixed cases that MUST pass
│   │   └── generator-basic.yaml
│   └── run.ts            # Eval runner invoked by CI
└── README.md
```

## Versioning rules

- Never edit a published version in place. Create `vN+1.yaml` and switch usage.
- Every `Suggestion` and `AIUsage` row records `prompt_version` (`<module>@<version>`).
- Canary evals MUST be updated alongside any prompt change.

## Schema

See `shared/src/prompts.ts` for the Zod schema. Each YAML file has:

```yaml
id: generator
version: v1
model: opus
description: Single-line what this prompt does.
system: |
  The system prompt.
user_template: |
  The user-facing template with {placeholders}.
output_schema:
  type: object
  properties: ...
canary_cases:
  - name: basic-case
    input: { ... }
    assertions:
      - "response.body contains no em dash"
      - "response.body length >= 800"
metadata:
  owner_agent: llm-collaborator
  created_at: 2026-04-20
```

## Running evals

```
pnpm evals
```

This loads every canary case under `prompts/evals/canary/`, runs it against the
referenced prompt, and fails CI if any assertion fails.

In Phase 1 the eval runner is a skeleton. Real prompts and real evals arrive in
Phase 3.
