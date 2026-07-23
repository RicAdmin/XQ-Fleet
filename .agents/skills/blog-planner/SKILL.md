---
name: blog-planner
description: Plan evidence-led XQ Car blog work. Use for blog ideas, editorial calendars, topic research, article plans, or deciding what the XQ Car blog should publish next.
---

# XQ Car Blog Planner

Turn a traveller question, search opportunity, business change, or archive gap into a confirmed writer-ready plan. Keep every language version independent.

## 1. Establish the editorial ground

From the repository root, read:

- [`docs/editorial/xq-car-blog-voice.md`](../../../docs/editorial/xq-car-blog-voice.md) in full
- `src/lib/blog/types.ts` and `src/lib/blog/markdown.ts`
- every filename and frontmatter block in `content/blog/`
- every plan and [`plans/blog/PUBLISHING_QUEUE.md`](../../../plans/blog/PUBLISHING_QUEUE.md)
- the relevant live business sources named by the voice guide

Treat existing posts as overlap evidence, not factual authority.

**Complete when:** the proposed work has no title, angle, reader-intent, or language collision with a published post or active plan.

## 2. Choose the branch

- For a supplied topic, develop that topic directly.
- For ideas, a calendar, or an invocation without direction, research and present 5–8 ranked candidates. Stop so the user can select.
- For selected candidates, create one plan per selected language version. Default to English; Malay and Chinese posts require separate plans and `-ms` or `-zh` slugs.

Discover repository facts yourself. Ask only when a decision would materially change the topic, language, or queue position.

**Complete when:** every planned topic and language is explicitly supplied or selected; a shortlist alone is not a confirmed plan.

## 3. Research through five lenses

Research each candidate through every lens that can change its angle:

1. **Traveller decision** — the choice, worry, comparison, route, timing, or cost question the post must resolve.
2. **Island timing** — current seasons, holidays, transport changes, closures, access rules, and other short-lived conditions.
3. **Operator truth** — current fleet, prices, booking behavior, pickup process, policies, and internal links supported by live repository data.
4. **Editorial gap** — what generic travel or rental pages flatten, and what a transparent Langkawi operator can say more precisely.
5. **Verification** — what is verified now, what needs an XQ Car operator check, and what will expire.

Browse for current conditions and real search language. Use first-party analytics or a named keyword tool when available; otherwise treat recurring questions and result phrasing as qualitative evidence. Record source URLs and access dates. Prefer official operators, government sources, primary documents, and named local reporting. Use search snippets and anonymous listicles only to discover stronger sources. Never invent search volume or first-hand observation.

**Complete when:** the angle has current evidence, a specific traveller decision, an XQ Car-relevant contribution, and an honest verification path.

## 4. Rank ideas

Give every shortlisted candidate:

- working title, language, and category
- one-sentence thesis
- traveller and decision served
- why XQ Car should publish it
- available evidence and outstanding operator checks
- primary search query and likely internal links
- recommended queue position and timing

Rank usefulness and defensibility before raw traffic potential.

**Complete when:** every candidate can be compared on reader value, evidence, timing, and verification cost.

## 5. Save confirmed plans and queue them

Write each confirmed plan to `plans/blog/<slug>.md`:

```markdown
---
title: 'Working title'
slug: 'unique-filename-slug'
language: en
category: Guides
status: pending
created: YYYY-MM-DD
primaryQuery: 'main reader query'
readerIntent: 'decision the reader needs to make'
---

## Editorial Thesis

[The specific claim or organising idea.]

## Answer-First Promise

[The useful answer the post must deliver in its opening.]

## Reader

[Who this is for, what they know, and what they need to decide.]

## Outline

1. [Section and its job]

## Evidence Ledger

| Claim or detail | Source             | Checked    | Status                             |
| --------------- | ------------------ | ---------- | ---------------------------------- |
| [Fact]          | [URL or repo path] | YYYY-MM-DD | verified / operator check required |

## Product Connections

- Vehicle slugs: [only slugs verified in current project data]
- Internal links: [only existing routes and blog slugs]

## Search Language

- Primary query: [one]
- Natural variants: [two to four]
- Questions to answer: [reader questions]

## Image Brief

- Project-owned candidates: [paths checked under `public/image/`]
- Generated fallback: [clearly illustrative concept, composition, XQ Car palette, orientation]

## Voice Notes

[Tone risks and the specific operator perspective earned by the evidence.]

## Freshness and Operator Checks

- [Volatile fact and recheck date]
- [First-hand detail still requiring confirmation]
```

Add the plan once to the ordered list in `plans/blog/PUBLISHING_QUEUE.md`. Put it at the user-selected position; otherwise append it. Add an optional `— YYYY-MM-DD` date only when scheduling is intentional. Keep status solely in the plan.

**Complete when:** every confirmed plan is `pending`, has an evidence ledger sufficient for honest drafting, and appears exactly once in the publishing queue.

## Handoff

Report saved paths, queue positions, strongest thesis, unresolved operator checks, and short-lived facts. Recommend `$blog-writer` only when unresolved checks do not block publication.
