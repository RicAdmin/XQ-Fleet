---
name: blog-writer
description: Write and verify publishable XQ Car blog posts from the publishing sequence. Use when asked to draft, write, complete, or publish the next blog post, or any article from the XQ Car blog queue.
---

# XQ Car Blog Writer

Turn one confirmed plan into a factual Markdown post in `content/blog/`. Each English, Malay, or Chinese article is an independent post.

## 1. Read the publishing sequence and claim the next post

The publishing sequence is [`plans/blog/PUBLISHING_QUEUE.md`](../../../plans/blog/PUBLISHING_QUEUE.md). Read it first on every invocation, then open the linked plan files as needed.

Pick work in this order:

1. If the user names a queued slug or title, use that entry — including a future-dated one.
2. Otherwise walk the sequence from the top and claim the first **eligible** entry:
   - Undated entries are immediately eligible.
   - Dated entries are eligible when their date is today or earlier.
   - Skip entries whose plan `status` is not `pending` (already `in-progress`, `complete`, or missing).
3. If nothing is eligible, stop. Report the next dated entry and its schedule; do not invent work.
4. If the sequence is empty, stop and recommend `$blog-planner`.

Do not ask which post to write when eligibility is clear. State the chosen slug, title, language, and queue position, then claim it: set the plan to `status: in-progress` before drafting. If publication becomes blocked, restore `pending` and record the blocker under `Freshness and Operator Checks`.

**Complete when:** exactly one queued plan is in scope and its status reflects whether writing is active or blocked.

## 2. Load the contract

Read:

- the selected plan in full
- [`docs/editorial/xq-car-blog-voice.md`](../../../docs/editorial/xq-car-blog-voice.md) in full
- `src/lib/blog/types.ts` and `src/lib/blog/markdown.ts`
- all relevant post frontmatter and bodies in `content/blog/`
- every live repository source relevant to the post's operational claims

The published brand is **XQ Car**; use **XQCar Team** only for the configured author name. Treat the route locale as presentation context, never as a content selector.

**Complete when:** the language, category, schema, internal links, image candidates, and claims requiring re-verification are explicit.

## 3. Close the evidence gaps

Work through every Evidence Ledger row. Re-check volatile prices, fleet details, schedules, access rules, policies, closures, and transport facts against live repository data and current primary sources. Update each row's source, checked date, and status.

Use this evidence order:

1. current XQ Car project data or recorded operator confirmation
2. official operator, government, or tourism source
3. named reputable local reporting
4. corroborated secondary sources for context

Attribute practical external facts with natural links and state effective dates where useful. Use “we” and first-hand operational claims only when repository data or recorded XQ Car notes support them. Narrow the article or return it to `pending` when an operator-dependent claim remains unresolved.

**Complete when:** every actionable claim is verified, attributed, dated where needed, or removed.

## 4. Secure the cover image

Search `public/image/` for a relevant project-owned image first. Use a supplied image when the user provides one. When neither yields a suitable cover, invoke the available `imagegen` skill to create a clearly illustrative editorial cover using the XQ Car palette. Avoid documentary treatment for generated places, vehicles, or customer scenes.

Store generated covers under `public/image/blog/<slug>/` and reference the actual asset path in frontmatter. Record the generation prompt and date in the plan's Image Brief.

**Complete when:** the `heroImage` path resolves and any generated cover is recognisably editorial rather than documentary evidence.

## 5. Draft the Markdown post

Write `content/blog/<slug>.md`. The filename is the slug. Use `-ms` for Malay and `-zh` for Chinese; the plan language and suffix must agree.

```markdown
---
title: 'Article title'
metaTitle: 'Search title · XQ Car'
metaDescription: 'Specific answer-first search description.'
category: Guides
tag: Guide
language: en
publishedAt: YYYY-MM-DD
updatedAt: YYYY-MM-DD
heroImage: /image/path/to-cover.jpg
excerpt: 'Specific card summary.'
keywords:
  - primary query
---

The plain-text opening paragraph is the styled lead and delivers the useful answer early.

## Descriptive heading

Article body in Markdown.
```

Use only `Guides`, `Airport & Pickup`, `Planning`, `Driving`, or `Pricing`. Add `featured: true` only when the user explicitly changes the featured post. Keep the opening paragraph plain text. Use descriptive H2s and H3s, natural links, lists where they improve scanning, and exact existing internal paths. Write one language only; a translation is separate queued work.

**Complete when:** the draft fulfils the plan's promise, passes the live frontmatter contract, and contains no unsupported first-hand voice.

## 6. Edit in three passes

1. **Accuracy pass** — verify every name, number, date, price, schedule, policy, link, vehicle, and image path.
2. **Operator-guide pass** — use exact nouns, useful judgement, transparent commercial context, concrete trade-offs, and the shared voice reference.
3. **Answer pass** — sharpen title and excerpt, put the decision rule early, make headings useful out of context, and remove repeated conclusions or keyword-shaped filler.

**Complete when:** all three passes leave no unresolved accuracy, voice, or reader-intent issue.

## 7. Validate and complete

Verify:

- the filename slug is unique and has the correct language suffix
- every internal blog link points to an existing file
- `category` and `language` use the live enums
- the image exists under `public/` or is a deliberate remote project asset
- the excerpt accurately describes the post
- Markdown and frontmatter render through the repository build

Run:

```bash
pnpm exec prettier --check content/blog/<slug>.md plans/blog/<slug>.md plans/blog/PUBLISHING_QUEUE.md
pnpm test -- src/lib/blog/markdown.test.ts
pnpm build
```

Fix failures caused by the post. Then update the plan:

```yaml
status: complete
completedAt: YYYY-MM-DD
output: content/blog/<slug>.md
```

Remove the completed entry from the publishing sequence in `plans/blog/PUBLISHING_QUEUE.md`; its plan remains the publication record.

**Complete when:** validation passes, the plan is complete, the output resolves, and the publishing sequence contains no completed entry.

## Handoff

Report the post and plan paths, final title and excerpt, language, category, image source, internal links, verification date for volatile facts, and any operator observation that would improve a later revision.
