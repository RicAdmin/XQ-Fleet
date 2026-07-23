# Domain docs

This repository uses a single-context domain-document layout.

## Before exploring

Read these sources when they exist and are relevant:

- `CONTEXT.md` at the repository root for domain terminology.
- `docs/adr/` for architectural decisions affecting the area being changed.

If these sources do not exist, proceed without flagging their absence. They are created lazily when domain terms or architectural decisions need to be recorded.

## Use the glossary's vocabulary

Use terms defined in `CONTEXT.md` when naming concepts in issues, proposals, hypotheses, and tests. Avoid synonyms that the glossary rejects. If a needed term is missing, reconsider whether new language is necessary or note the gap for later domain-modeling work.

## Flag ADR conflicts

Surface any conflict with an existing ADR explicitly instead of silently overriding the recorded decision.
