---
name: do-seo-work
description: Deliver one ready-for-seo-agent GitHub work package through claim, SEO Delivery Discipline, evidence, and tracker lifecycle updates. Use when the user says do-seo-work, asks to execute the next ready SEO/GEO issue, names a ready SEO package to deliver, or wants a loop or automation to drain the ready-for-seo-agent queue one package at a time.
---

# Do SEO Work

Run one package through **resolve → claim → SDD → evidence → lifecycle**, then stop. Consume the work-package graph created by `to-seo-issues` from the active thesis maintained by `seo-strategy`. Orchestrate the `sdd` skill for acceptance → delivery → evidence; do not inline or weaken its rules.

Do not form strategy, create work packages, perform engineering work, or claim organic outcomes. Route strategy changes to `seo-strategy`, graph changes to `to-seo-issues`, and engineering handoffs to the issue's `/to-issues <issue-url>` command.

## 1. Verify access

Use the repository configured in `docs/agents/issue-tracker.md`.

If `AGENT_GH_TOKEN` is set, export it as both `GH_TOKEN` and `GITHUB_TOKEN` before every `gh` call. It overrides a pre-existing limited installation token. Verify the identity with `gh api user --jq .login` and verify that it can list repository issues.

If neither `AGENT_GH_TOKEN` nor the current `GH_TOKEN` can read and mutate issues, stop before claiming and report the missing access.

**Complete when:** the repository and authenticated actor are known and issue reads and mutations work, or the run stopped without a claim.

## 2. Resolve exactly one package

Parse the invocation:

| Input | Package |
| --- | --- |
| One issue number or URL | Resolve that issue. |
| Bare invocation or loop tick | Select the lowest-numbered eligible issue. |
| Multiple issues | Refuse and ask for one; `sdd` delivers exactly one package per run. |

An auto-picked issue is eligible only when it is open, has `ready-for-seo-agent`, lacks `WIP` and `HITL`, is not labeled `seo-strategy` or `seo-engineering-handoff`, and has no open hard prerequisite or native blocker. If the queue is empty, exit quietly.

A named issue must meet the same conditions. If it does not, state the exact mismatch and stop without changing labels.

Load the complete issue, thesis parent, active `SEO-STRATEGY.md`, linked research, dependencies, comments that alter authority or approval, and the shared work-package contract used by `to-seo-issues`. Inspect the named delivery surfaces enough to identify whether the package can modify the repository.

For a repository-backed package, refuse before claiming if the working tree is dirty, a merge or rebase is active, or the current branch cannot safely branch from the up-to-date default base. External-only delivery does not require a clean working tree.

**Complete when:** one candidate and all preflight context are fixed, or the run exited without mutation.

## 3. Claim atomically

Claim the package immediately before delivery:

1. Add `WIP` and remove `ready-for-seo-agent` in one issue edit.
2. Re-fetch the issue.
3. Require it to remain open, contain `WIP`, lack `ready-for-seo-agent`, and retain the expected identity and dependency state.

If verification fails, remove only the `WIP` label added by this run when it is safe to do so, then stop. Never deliver an unverified claim.

For a repository-backed package, create and check out `seo-issue-<n>-<short-slug>` from the repository's up-to-date default base after the claim. Never commit on the default branch.

**Complete when:** the issue has a verified exclusive claim and any required delivery branch exists, or no claim from this run remains held.

## 4. Deliver with SDD

Invoke `sdd` against the claimed issue. Let it independently verify readiness, establish the specification oracle, execute the matching archetype in acceptance slices, and return exactly one result: **Delivered**, **Hold**, or **Redirect**.

Treat repository-managed content, metadata, citation data, and SEO artifacts as SEO delivery. If satisfying the issue requires executable behavior, components, tests, migrations, or build configuration, accept SDD's engineering **Redirect** regardless of the apparent size.

Do not perform tracker mutations while SDD is executing. Preserve every completed artifact and evidence item if it stops at a resumable boundary.

**Complete when:** SDD returned one supported status and a manifest covering every acceptance criterion.

## 5. Package repository evidence

Skip this section when SDD changed no repository files.

Verify that the diff contains only authorized, non-engineering SEO deliverables and required evidence. If it contains executable behavior or unrelated changes, return **Redirect** and preserve the branch without committing the unauthorized scope.

Commit the verified deliverables and evidence, push the branch, and open a draft PR that:

- links the thesis and claimed package;
- includes the SDD evidence manifest and limitations;
- uses `Closes #<n>` for the claimed package;
- does not claim rankings, traffic, citations, replies, placements, or conversions.

The draft PR is the persistent delivery surface. Do not close the issue directly; merging the PR completes that tracker transition.

If commit, push, or PR creation fails, convert the result to **Hold** at the exact failed boundary. Preserve the branch and artifacts.

**Complete when:** a draft PR contains the locatable repository deliverable and evidence, no direct-close is pending, or the result has an exact Hold/Redirect boundary.

## 6. Apply the lifecycle result

Re-fetch the issue before mutation. Never restore `ready-for-seo-agent` automatically.

### Delivered

Post the status, deliverable locations, full SDD evidence manifest, limitations, and any uncontrolled outcomes.

- With a draft PR: link the PR, remove `WIP`, and leave the issue open for merge.
- Without a draft PR: remove `WIP` and close the issue as completed.

Then inspect each direct dependent. Add `ready-for-seo-agent` only when the shared contract's complete readiness test now passes from actual sources, including elapsed review windows. Do not promote dependents from dependency closure alone.

### Hold

Post the failed readiness condition or operational boundary, completed evidence, exact unblock action, resumable boundary, and owner when known. Remove `WIP`.

Add `HITL` only when a human decision, access grant, approval, correction, or irreversible-action checkpoint is required. For a time gate, transient provider condition, or other non-human hold, leave `HITL` absent and state how readiness must be re-evaluated. Do not close the issue.

### Redirect

Post the classification or split error, preserved artifacts, exact next workflow, and resumable boundary. Remove `WIP` and do not close the issue.

- Engineering: add `seo-engineering-handoff` when missing and post `/to-issues <issue-url>`.
- Strategy conflict or change: add `HITL` and route to `seo-strategy`.
- Package graph, archetype, or split-boundary error: add `HITL` and route to `to-seo-issues`.

Apply no other label, parent, dependency, assignment, or closure changes unless they are explicitly supported by the SDD result and this lifecycle contract.

**Complete when:** the tracker mirrors Delivered, Hold, or Redirect; the claim is released; evidence is locatable; and any newly ready dependent passed a fresh readiness check.

## 7. Return and stop

Report the issue, final status, deliverable or PR locations, lifecycle mutations, promoted dependents, limitations, and next owner or command. Stop after this one package. A loop or automation must invoke the skill again to drain another package.
