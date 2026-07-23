# Artifacts

Disclosed reference for the do-work artifacts step. Load when classifying the diff and packaging the draft PR.

## Classification

| Diff touch | Branch |
| --- | --- |
| UI routes / components / styles | Frontend |
| Server functions / API / DB / migrations only | Backend |
| Both | Both (ship both artifact sets) |

## Frontend

- **Playwright:** Add or extend specs under the repo’s existing layout (prior art: `demo/scenario-*.spec.ts`, or paths named in the issue’s Testing Decisions). Prefer extending TDD seam tests over a second suite.
- **Screenshots:** Capture the journeys the AC care about (viewport shots preferred over full-page unless the AC need scroll). Then **post** them into the draft PR — capture alone is not done.
- **PR body:** Short “How to verify” with the Playwright file paths and a Screenshots section that embeds every posted image.

### Posting screenshots (required for frontend)

GitHub’s browser image-upload endpoint does **not** accept `AGENT_GH_TOKEN` / PAT auth. Do not stall on `uploads.github.com`. Post via the branch instead:

1. Write PNGs under `docs/pr-artifacts/<issue-n>/` on the work branch (create the dirs as needed).
2. Commit and push them on that branch (these binaries are review evidence for the PR, not app runtime assets).
3. In the draft PR body, add a **Screenshots** section with one markdown image per file, using branch raw URLs:

```markdown
## Screenshots

### <what this shot shows>
![<alt>](https://github.com/<owner>/<repo>/raw/<branch>/docs/pr-artifacts/<issue-n>/<file>.png)
```

Use `github.com/.../raw/<branch>/...` (not `raw.githubusercontent.com`) so collaborators viewing the PR while logged in can see private-repo images.

**Done when:** every captured AC journey appears as an embedded image in the PR body (or an immediate PR comment if the body edit failed), and the image URLs resolve on the pushed branch.

## Backend

- **API specification:** In the PR body, document each new or changed endpoint/server function: method/name, inputs, outputs, auth, and error cases that AC require.
- **Bruno:** Commit requests under `bruno/` (create the collection root if missing). One request (or folder) per new/changed endpoint; enough to exercise the happy path and the AC-relevant errors.
- **PR body:** Link the Bruno paths next to the API spec section.

## Mixed

Ship frontend and backend sets. Shared domain changes mentioned once; do not duplicate the same behavior as both a tautological unit test and a Bruno call unless they hit different seams.
