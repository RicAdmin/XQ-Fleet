---
name: do-work
description: Do work on ready-for-agent GitHub issues — claim, implement, draft PR with FE/BE artifacts. Use when the user says do-work, wants the next ready issue implemented, or a loop/automation should drain the ready-for-agent queue.
---

# Do Work

Pipeline: **resolve → claim → implement → artifacts → draft PR**. One **work unit** per run, then stop. Does not write PRDs or create issues.

Orchestrate the `implement` skill. Do not inline implementation rules here.

## 1. Preconditions

Refuse before any claim if the working tree is dirty or a merge/rebase is in progress. Say why and stop.

**GitHub auth (cloud):** If `AGENT_GH_TOKEN` is set, export it as `GH_TOKEN` and `GITHUB_TOKEN` before any `gh` call (overrides Cursor’s limited `ghs_…` token). Verify with `gh api user --jq .login`. If neither `AGENT_GH_TOKEN` nor a working `GH_TOKEN` can list issues, stop and report missing secrets — do not claim.

**Done when:** tree is clean and not mid-merge/rebase, `gh` can reach the repo’s issues (or the run has stopped without claiming).

## 2. Resolve the work unit

Parse the invocation:

| Input | Work unit | PRD context |
| --- | --- | --- |
| Issue numbers (e.g. `#14 #15`) | All non-`PRD` issues named | Any `PRD`-labeled issue in the args, else walk each work issue’s Parent link |
| Bare (`/do-work` / loop tick) | Auto-pick exactly one eligible issue | Walk Parent link if present |
| Only a `PRD` named | None — quiet exit (PRD is never work) | — |

**Eligible** for auto-pick (lowest number wins): open, has `ready-for-agent`, no `WIP`, no `HITL`, not labeled `PRD`, not blocked by an open issue.

`PRD`-labeled issues are **context only** — never claimed, never `Closes`’d.

If a **named** work issue is blocked by an open issue: refuse, explain the blocker, stop. No labels.

If the eligible queue is empty: quiet exit.

Load PRD + issue bodies (acceptance criteria, Testing Decisions, blocked-by).

**Done when:** the work-unit issue list is fixed (or the run exited quietly / refused), and PRD context is loaded when it exists.

## 3. Claim

Before coding, claim **every** work-unit issue (all-or-nothing):

1. Add `WIP`, remove `ready-for-agent`.
2. Re-fetch each issue. If `WIP` is missing or state is unexpected (race): remove any `WIP` you added, stop, and do not proceed.
3. On any later abort before a successful claim verify across the whole batch: release `WIP` you added on siblings.

**Done when:** every work-unit issue has `WIP`, lacks `ready-for-agent`, and verify-after-write passed — or the run aborted with no partial claim left held.

## 4. Seams gate

Read Testing Decisions / acceptance criteria on the PRD and issues.

- If seams are named clearly enough for implementation: treat them as pre-confirmed; proceed.
- If seams are missing or ambiguous: comment on the issue what is unclear, remove `WIP`, add `HITL`, stop. Human re-arms later by removing `HITL` and adding `ready-for-agent`.

**Done when:** seams are fixed for the `implement` skill, or every claimed issue has been swapped to `HITL` and the run has stopped.

## 5. Branch

From the repo’s default base (`main`): create and check out `issue-<n>-<short-slug>` (`<n>` = lowest work-unit number; slug from that issue’s title). Never commit on `main`.

**Done when:** HEAD is the new branch from an up-to-date base.

## 6. Implement

Run the `implement` skill against the agreed seams and acceptance criteria until:

- every acceptance criterion on every work-unit issue is satisfied by the change, and
- tests are green.

The `implement` skill owns TDD at seams, typechecking, the full test suite, code review, and commit — do not duplicate those steps here.

On an **actionable failure** (won’t go green, missing access, scope explosion, etc.): comment what failed on the issue(s), remove `WIP`, add `HITL`, stop. Do not restore `ready-for-agent`.

**Done when:** AC + green tests hold for the whole work unit, or issues are on `HITL` and the run has stopped.

## 7. Artifacts

Classify from the **diff** (not labels):

- UI routes/components touched → frontend branch
- Server/API/db only → backend branch
- Both → both artifact sets

Follow [artifacts.md](artifacts.md). Reuse tests from the implement step; do not invent a parallel suite.

**Done when:** required artifact set for the classification is present (committed scripts/requests + frontend screenshots captured under `docs/pr-artifacts/` when UI changed).

## 8. Draft PR

Open a **draft** PR (never ready-for-review by default):

- Body links `Closes #N` for every work-unit issue (not the PRD).
- Attach artifact evidence per [artifacts.md](artifacts.md) — for frontend, that includes **posting** screenshots into the PR body (branch raw URLs), not only capturing them locally.
- Then remove `WIP` from every work-unit issue.

Stop. Do not auto-pick another issue in this run.

**Done when:** draft PR exists with `Closes` for the work unit, artifact evidence is in the PR body (including embedded screenshots when frontend), and `WIP` is cleared on those issues.
