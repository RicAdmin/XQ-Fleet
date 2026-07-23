# Blog Content Migration Plan

## Intent

Make Markdown the single source of truth for the XQ Car blog and add predictable planning and writing skills tailored to this repository.

## Data

- Store every article as `content/blog/<slug>.md`.
- Keep English, Malay, and Chinese articles independent. Translated articles use unique `-ms` or `-zh` slugs and declare `language` metadata.
- Preserve the existing five blog categories.
- Derive the filename slug, read time, and default author in code; store the remaining article metadata in frontmatter.

## API

No public route changes. Existing `/$locale/blog` routes load the same locale-neutral article collection, and the route locale never selects article content.

## Edge Cases

- Duplicate slugs, invalid categories or languages, missing required frontmatter, malformed dates, unsafe Markdown HTML, and filename/frontmatter drift fail during module loading or build.
- Missing article slugs continue to return the existing not-found response.
- Existing partial Malay and Chinese translations become separately addressable articles.

## Non-functional

- Embed Markdown with Vite `import.meta.glob` so deployment does not depend on runtime filesystem access.
- Sanitize rendered HTML before it reaches React.
- Preserve the current blog UI and migrated copy.

## Rollout

Migrate the complete archive in one change, delete the TypeScript post store, and verify tests plus the production build. Rollback is a normal git revert.

## Out of scope

- Translating additional archive posts.
- Redesigning blog pages.
- Changing URL locale behavior.
- Rewriting or fact-checking existing copy during the mechanical migration.

## Plan

### Feature intent

Replace embedded TypeScript articles with build-time Markdown and install a two-stage editorial workflow.

### Data model

Frontmatter maps to the existing `BlogPost` contract plus `language`; Markdown body replaces `lead` and structured `sections` source data.

### API surface

N/A: route shapes and loader return values remain unchanged.

### Modules affected

`content/blog/`, `src/lib/blog/`, the blog content renderer, repo-local skills under `.agents/skills/`, `docs/editorial/`, and `plans/blog/`.

### UI surface

The existing index and article pages remain visually unchanged. Article bodies render sanitized Markdown instead of a fixed section union.

### Error contract

Invalid repository content is a build-time terminal error naming the source file and invalid field. Unknown URL slugs retain the existing 404 behavior.

### Test strategy

Unit-test frontmatter/body parsing and archive invariants, then run formatting, targeted tests, lint, and the production build.

### Observability

N/A: static build-time content has no runtime operational events.

### Feature flag

N/A: the complete archive moves atomically to one canonical store.

### Migration plan

Generate equivalent Markdown from all existing article objects, compare slugs and counts, switch loaders, then remove `src/lib/blog/posts.ts`. Git revert restores the previous store.

### Out of scope

The rollout does not change editorial copy, translate untranslated posts, or alter the blog design.

### Engineer objections

None.

## As-built

The migration matches the approved plan. Twenty English source posts became Markdown, and the two existing Malay plus two Chinese variants became independent suffixed posts, for 24 files total. The route locale no longer resolves article translations.

The Markdown pipeline uses `gray-matter`, `marked`, and `sanitize-html`, embedded at build time behind a TanStack server function. Validation enforces required frontmatter, the closed category and language enums, ISO dates, language suffixes, a plain-text lead, unique filename slugs, and sanitized rendered HTML.

Added the repo-local `blog-planner` and `blog-writer` skills, their UI metadata, the XQ Car editorial voice reference, and the publishing queue. No feature flag or database migration was needed. Rollback remains a normal git revert of this change.

Verification completed:

- Both skill packages pass the official `quick_validate.py` validator.
- Focused ESLint passes for every changed TypeScript module.
- The full test suite passes: 16 files and 112 tests.
- The production client and SSR build passes.
- Full-repository ESLint remains blocked by 245 pre-existing errors outside this change.

## Draft PR Description

### Summary

- Replace the embedded TypeScript blog archive with 24 build-time Markdown posts, including independent Malay and Chinese variants.
- Add validated, sanitized Markdown rendering without changing public route shapes.
- Add model-invokable XQ Car blog planning and writing skills, an editorial voice contract, and a single publishing queue.

### Test plan

- [x] Validate both skill packages with `quick_validate.py`.
- [x] Run focused ESLint on every changed TypeScript module.
- [x] Run the full Vitest suite (112 tests).
- [x] Run the production client and SSR build.

### Rollback

Revert this change to restore `src/lib/blog/posts.ts` and the previous locale-resolution behavior.

### Flag

N/A: this is an atomic static-content migration with git-revert rollback.
