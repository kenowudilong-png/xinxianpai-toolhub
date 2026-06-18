# Toolhub Automation Factory Final 40% Implementation Plan

> **For Hermes:** Execute this plan autonomously task-by-task. User has approved execution without intermediate human review and will only inspect the final result. Still obey hard safety boundaries: no secrets, no production data, no VPS/Production operations, no destructive actions, no deployment beyond local/staging simulation.

**Goal:** Finish the remaining 40% of the Xinxianpai Toolhub automation-development factory so future second-development work follows a repeatable local/GitHub/Runner/Staging evidence chain instead of chat memory.

**Architecture:** Keep the actual product as a local Mac mini toolhub (`apps/web` on 18083 and `apps/gip-team` on 18085). Treat GitHub PR + Mac mini Runner as the engineering quality gate. Treat `factory/` as the durable control plane: SOP, playbook, policies, decisions, task runs, status, blockers, and evidence. Production/VPS is out of scope unless Keno later explicitly reopens it.

**Tech Stack:** Markdown ledgers, YAML policy files, Bash safety scripts, Node.js/npm/pnpm project checks, GitHub Actions self-hosted runner, local screen-based runtime.

---

## Operating Assumptions

- Product repo: `/Users/mima0000/Documents/xinxianpai/toolhub/xinxianpai-toolhub`
- Factory root: `/Users/mima0000/Documents/xinxianpai/factory`
- Runtime target: local Mac mini only.
- Access URL: `http://127.0.0.1:18083`
- GIP API: `http://127.0.0.1:18085`
- GitHub repo: `kenowudilong-png/xinxianpai-toolhub`
- Intermediate Keno approvals are waived for this final closeout batch, but all approval decisions must be recorded as delegated/standing authorization.
- Any step that would read real secrets, production DBs, or operate VPS/Production must be skipped and recorded as out-of-scope.

---

## Completion Definition

The project reaches “automation second-development ready” when all are true:

- `factory/FACTORY_SOP.md` exists and matches the attached SOP adjusted for local-first operation.
- `factory/FACTORY_PLAYBOOK.md` defines exactly how Hermes runs future tasks.
- `factory/DECISIONS.md` records Keno's standing authorization and local-only scope.
- `factory/policies/*.yaml` define codex, security, release/local-staging, and tool acceptance rules.
- `factory/runs/` contains at least one full example run with `INTAKE.md`, `SCAN_REPORT.md`, `EVALUATION.md`, `IMPLEMENTATION_PLAN.md`, `REVIEW_REPORT.md`, and `LOCAL_STAGING_REPORT.md`.
- Repo has a PR template matching SOP requirements.
- Repo has reliable local scripts for: start, stop, healthcheck, local smoke, and factory audit.
- Runner/CI check commands are documented and reproducible locally.
- Local toolhub starts, health checks pass, and a smoke script proves the main route/API are reachable.
- Factory status files state that VPS/Production is not part of the current objective.

---

## Phase 0: Safety Baseline and Snapshot

### Task 0.1: Record local-only authorization

**Objective:** Create a durable decision stating this final batch is authorized without intermediate review and excludes VPS/Production.

**Files:**
- Modify: `/Users/mima0000/Documents/xinxianpai/factory/DECISIONS.md`
- Modify: `/Users/mima0000/Documents/xinxianpai/factory/PROJECT_STATUS.md`

**Steps:**
1. If `DECISIONS.md` does not exist, create it.
2. Add decision `D-20260618-LOCAL-FACTORY-CLOSEOUT`:
   - Decision maker: Keno
   - Result: approved
   - Scope: local/GitHub/Runner/factory only
   - No intermediate approval required
   - Explicit exclusions: VPS, Production, real secrets, real DB content, external deployment
3. Append a short status update to `PROJECT_STATUS.md`.

**Validation:**
- `grep -n "D-20260618-LOCAL-FACTORY-CLOSEOUT" factory/DECISIONS.md`
- `grep -n "local/GitHub/Runner/factory" factory/PROJECT_STATUS.md`

---

### Task 0.2: Capture current repo/tooling snapshot

**Objective:** Make the current baseline auditable before changes.

**Files:**
- Create: `/Users/mima0000/Documents/xinxianpai/factory/runs/20260618-factory-final-closeout/BASELINE.md`

**Steps:**
1. Record product repo branch and commit.
2. Record working tree status.
3. Record Node/npm/pnpm availability.
4. Record local ports 18083/18085 status.
5. Record existing factory files relevant to SOP.
6. Do not output env values.

**Validation:**
- File exists and contains sections: Git, Tooling, Runtime, Factory Files, Safety.

---

## Phase 1: Standard Factory Skeleton

### Task 1.1: Create canonical factory directories

**Objective:** Make the factory match SOP's expected structure.

**Files/Dirs:**
- Create: `factory/docs/`
- Create: `factory/policies/`
- Create: `factory/runs/20260618-factory-final-closeout/`

**Steps:**
1. Create directories if missing.
2. Add `.gitkeep` where a directory would otherwise be empty.
3. Do not modify `workspaces/` reference data.

**Validation:**
- `test -d factory/docs`
- `test -d factory/policies`
- `test -d factory/runs/20260618-factory-final-closeout`

---

### Task 1.2: Write `FACTORY_SOP.md`

**Objective:** Store the user-provided SOP as the canonical local factory SOP, with a local-first addendum.

**Files:**
- Create: `/Users/mima0000/Documents/xinxianpai/factory/FACTORY_SOP.md`

**Content requirements:**
- Include SOP sections: roles, layers, standard state flow, artifacts, full process, approval gates, red lines, standard files, PR template, Runner checks, Staging standards, completion definition.
- Add local-first addendum:
  - Current project runtime is local Mac mini.
  - Production section is dormant unless explicitly reopened.
  - Local staging substitutes for external staging for this closeout batch.

**Validation:**
- `grep -n "工具站自动化开发工厂" FACTORY_SOP.md`
- `grep -n "Local-first Addendum" FACTORY_SOP.md`

---

### Task 1.3: Write `FACTORY_PLAYBOOK.md`

**Objective:** Convert SOP into an operational checklist Hermes can run every future task from.

**Files:**
- Create: `/Users/mima0000/Documents/xinxianpai/factory/FACTORY_PLAYBOOK.md`

**Required sections:**
1. New task intake procedure.
2. Read-only scan procedure.
3. Evaluation rubric.
4. Implementation plan template.
5. Codex task prompt template.
6. PR review checklist.
7. Runner failure triage.
8. Local staging/smoke process.
9. Status update rules.
10. Stop conditions.

**Validation:**
- Contains all 10 headings.
- Mentions `PROJECT_STATUS.md`, `BLOCKERS.md`, `DECISIONS.md`, and `runs/<date-task>/`.

---

## Phase 2: Policy Files

### Task 2.1: Create `codex_rules.yaml`

**Objective:** Define exact boundaries for Codex as a coding worker.

**Files:**
- Create: `/Users/mima0000/Documents/xinxianpai/factory/policies/codex_rules.yaml`

**Rules to encode:**
- Requires task ID and scope.
- Requires branch and PR for code changes.
- Prohibits Production/VPS operations.
- Prohibits env/secret/DB reads.
- Requires self-test evidence.
- Requires no uncommitted changes at handoff.

**Validation:**
- Parse YAML with Python stdlib or PyYAML if available.

---

### Task 2.2: Create `security_rules.yaml`

**Objective:** Make safety constraints machine-readable.

**Files:**
- Create: `/Users/mima0000/Documents/xinxianpai/factory/policies/security_rules.yaml`

**Rules to encode:**
- No real secrets in CI/logs/frontend/test snapshots.
- No production data reads.
- No staging/production data mixing.
- Safe env key-only checks allowed.
- Redaction rules for reports.
- Allowed local runtime ports.

**Validation:**
- YAML parses.
- Contains `forbidden_paths`, `allowed_runtime_ports`, and `redaction` keys.

---

### Task 2.3: Create `release_rules.yaml`

**Objective:** Adapt release gates to local-first operation while preserving future Production safety.

**Files:**
- Create: `/Users/mima0000/Documents/xinxianpai/factory/policies/release_rules.yaml`

**Rules to encode:**
- Current release target: local only.
- Production release: disabled by default.
- Local acceptance requires healthcheck + smoke + backup/dry-run evidence where applicable.
- Production requires explicit Keno reactivation.

**Validation:**
- YAML parses.
- Contains `production_enabled: false`.

---

### Task 2.4: Create `tool_acceptance.yaml`

**Objective:** Define what a newly integrated tool must prove before it is accepted into Toolhub.

**Files:**
- Create: `/Users/mima0000/Documents/xinxianpai/factory/policies/tool_acceptance.yaml`

**Rules to encode:**
- Login integration.
- Tool route.
- Key proxy/no frontend secrets.
- User/tool data isolation.
- Tests/build/smoke.
- Rollback/removal path.

**Validation:**
- YAML parses.
- Contains acceptance categories for `identity`, `secrets`, `data`, `quality`, `rollback`.

---

## Phase 3: Run Artifact Templates and Example Run

### Task 3.1: Create run directory index

**Objective:** Make `runs/` understandable and reusable.

**Files:**
- Create: `/Users/mima0000/Documents/xinxianpai/factory/runs/README.md`

**Content:**
- Explain run directory naming.
- List required artifacts.
- Explain status flow.
- Explain evidence rules.

**Validation:**
- `grep -n "INTAKE.md" factory/runs/README.md`

---

### Task 3.2: Create final-closeout intake

**Objective:** Backfill a proper SOP intake for this final 40% batch.

**Files:**
- Create: `factory/runs/20260618-factory-final-closeout/INTAKE.md`

**Content:**
- Requirement: finish last 40% of automation second-development factory.
- User: Keno.
- Success criteria: SOP files, policies, PR template, local staging, validation, final report.
- Non-goals: VPS/Production, new business features, secrets.

**Validation:**
- Contains Goal, User, Success Criteria, Non-goals, Risks.

---

### Task 3.3: Create scan report

**Objective:** Record current repo/factory scan evidence.

**Files:**
- Create: `factory/runs/20260618-factory-final-closeout/SCAN_REPORT.md`

**Content:**
- Product repo paths and major apps.
- Scripts found.
- Workflows found.
- Existing factory ledgers.
- Missing standard files.
- Tooling gaps: `gh` path issue, `pnpm` local PATH issue if still present.

**Validation:**
- Contains Scripts, Workflows, Factory State, Gaps.

---

### Task 3.4: Create evaluation report

**Objective:** Explain why this closeout is worth doing before more feature work.

**Files:**
- Create: `factory/runs/20260618-factory-final-closeout/EVALUATION.md`

**Content:**
- Recommendation: do now.
- Value: repeatable second development.
- Cost: small documentation/scripts/CI hygiene batch.
- Risks: over-engineering, toolchain instability.
- MVP scope: factory skeleton + local gate + PR template.

**Validation:**
- Contains recommendation and MVP scope.

---

### Task 3.5: Create implementation plan artifact

**Objective:** Store this plan inside the run directory for SOP compliance.

**Files:**
- Create: `factory/runs/20260618-factory-final-closeout/IMPLEMENTATION_PLAN.md`

**Content:**
- Summarize phases 0-9 of this plan.
- Reference canonical plan path under `.hermes/plans/`.

**Validation:**
- Contains phase checklist.

---

## Phase 4: Repository PR/Runner Hygiene

### Task 4.1: Add PR template

**Objective:** Ensure every future PR carries SOP-required review info.

**Files:**
- Create: `/Users/mima0000/Documents/xinxianpai/toolhub/xinxianpai-toolhub/.github/pull_request_template.md`

**Template sections:**
- PR Goal
- Changed Scope
- Explicit Non-goals
- Validation
- Risks
- Env/DB/Deployment impact
- Rollback
- Related Factory Task ID
- Keno Approval

**Validation:**
- `test -f .github/pull_request_template.md`
- Template contains `Task ID` and `Rollback`.

---

### Task 4.2: Add local factory audit script

**Objective:** Provide a single local command that checks the factory skeleton and local runtime preconditions.

**Files:**
- Create: `/Users/mima0000/Documents/xinxianpai/toolhub/xinxianpai-toolhub/scripts/factory-audit.sh`

**Script behavior:**
- `set -euo pipefail`.
- Derive repo root.
- Locate factory root default `/Users/mima0000/Documents/xinxianpai/factory`, override with `FACTORY_ROOT`.
- Verify required factory files exist.
- Verify policies parse as YAML using Python if available.
- Verify `.github/pull_request_template.md` exists.
- Verify local scripts exist and are executable/readable.
- Verify no `.env.production` values are printed.
- Output clear pass/fail lines.

**Validation:**
- `bash -n scripts/factory-audit.sh`
- `bash scripts/factory-audit.sh` exits 0 after required files exist.

---

### Task 4.3: Integrate factory audit into check script

**Objective:** Make factory readiness part of the local/CI quality gate without requiring secrets.

**Files:**
- Modify: `/Users/mima0000/Documents/xinxianpai/toolhub/xinxianpai-toolhub/scripts/check.sh`

**Change:**
- After `bash scripts/audit-integrity.sh`, run `bash scripts/factory-audit.sh` if the script exists.
- Do not run in a way that reads env values.

**Validation:**
- `bash -n scripts/check.sh`
- `CHECK_MODE=pr bash scripts/check.sh` reaches factory audit.

---

### Task 4.4: Harden local start env handling

**Objective:** Avoid requiring `.env.production` for local runtime when script already has safe defaults.

**Files:**
- Modify: `scripts/start-local.sh`
- Modify: `scripts/run-local-web.sh`
- Modify: `scripts/run-local-gip.sh`

**Change:**
- Replace unconditional `source .env.production` with:
  - `LOCAL_ENV_FILE=${LOCAL_ENV_FILE:-$ROOT_DIR/.env.production}`
  - If file exists, source it.
  - If missing, continue with defaults and print a warning to stderr.
- Preserve existing defaults for `DATA_DIR`, `LOG_DIR`, `PLATFORM_DB_PATH`, `GIP_INTERNAL_ORIGIN`, `PORT`.

**Validation:**
- Temporarily move `.env.production` aside only if safe backup is made.
- Run `bash scripts/start-local.sh` and confirm health OK with defaults.
- Restore `.env.production` if moved.

---

### Task 4.5: Add local smoke script

**Objective:** Provide a deterministic local acceptance check.

**Files:**
- Create: `scripts/local-smoke.sh`

**Script behavior:**
- Check `http://127.0.0.1:${PORT:-18083}/api/health`.
- Check `http://127.0.0.1:18085/api/health`.
- Check web root returns 200/302/307 acceptable.
- Print JSON-ish summary or simple PASS lines.
- Exit nonzero on failure.

**Validation:**
- `bash -n scripts/local-smoke.sh`
- With services running: `bash scripts/local-smoke.sh` exits 0.

---

## Phase 5: Local Staging Definition

### Task 5.1: Write local staging guide

**Objective:** Define “Staging” for the current local-first project so SOP no longer points at VPS.

**Files:**
- Create: `factory/docs/STAGING_GUIDE.md`

**Content:**
- Local staging = isolated env/data/log dirs on Mac mini.
- Does not use Production secrets/data.
- Recommended ports: web 18083, GIP 18085 for current local runtime; future staging may use alternate ports if needed.
- Required checks: start-local, local-smoke, test/build, backup dry-run if data-affecting changes.
- Evidence files to update.

**Validation:**
- Contains `Local staging` and `scripts/local-smoke.sh`.

---

### Task 5.2: Write runner operations guide

**Objective:** Document how to verify Mac mini Runner and GitHub checks.

**Files:**
- Create: `factory/docs/RUNNER_OPERATIONS.md`

**Content:**
- Required runner labels from `pr-check.yml`.
- How to check runner in GitHub UI.
- How to inspect PR Check results.
- Local equivalent commands.
- What counts as passed/skipped/failed/invalid.
- Known toolchain risks: `gh` path and `pnpm` availability.

**Validation:**
- Contains runner labels `self-hosted`, `macOS`, `ARM64`, `toolhub`, `macmini`.

---

### Task 5.3: Write backup/rollback local guide

**Objective:** Preserve rollback thinking without requiring Production.

**Files:**
- Create: `factory/docs/BACKUP_ROLLBACK.md`

**Content:**
- Local data root.
- When backup is required.
- How to run dry-run safely.
- What evidence to record.
- Production execute remains disabled unless reopened.

**Validation:**
- Contains `dry-run`, `no Production`, and evidence checklist.

---

## Phase 6: Status Ledger Cleanup

### Task 6.1: Normalize project status to local-first

**Objective:** Stop future Hermes/Codex from treating VPS/Production as current target.

**Files:**
- Modify: `factory/PROJECT_STATUS.md`

**Change:**
- Add a prominent section near top: `Current Operating Mode: local-first automation factory`.
- State active target: local Mac mini + GitHub PR/Runner.
- State dormant target: VPS/Production.
- State next active task: factory final closeout.

**Validation:**
- First 40 lines mention local-first current mode.

---

### Task 6.2: Normalize blockers

**Objective:** Make blockers reflect current mode without deleting history.

**Files:**
- Modify: `factory/BLOCKERS.md`

**Change:**
- Add `Current Active Blockers` section near top.
- Mark VPS/Production blockers as historical/not applicable for local mode.
- Active blockers should be limited to factory skeleton/toolchain/local smoke/runner checks.

**Validation:**
- First 40 lines contain active blockers table.

---

### Task 6.3: Create `FINAL_FACTORY_CLOSEOUT_REPORT.md`

**Objective:** Provide the final artifact Keno will inspect.

**Files:**
- Create: `factory/FINAL_FACTORY_CLOSEOUT_REPORT.md`

**Content:**
- Executive summary.
- What was built.
- Evidence table.
- Validation commands and outputs.
- What remains intentionally out of scope.
- How to run future task through SOP.

**Validation:**
- Contains final result and evidence table.

---

## Phase 7: Verification and PR

### Task 7.1: Run local verification matrix

**Objective:** Prove all changes work together.

**Commands:**
- `bash -n scripts/factory-audit.sh`
- `bash -n scripts/local-smoke.sh`
- `bash -n scripts/start-local.sh scripts/run-local-web.sh scripts/run-local-gip.sh scripts/check.sh`
- `bash scripts/factory-audit.sh`
- `bash scripts/start-local.sh`
- `bash scripts/local-smoke.sh`
- `CHECK_MODE=pr bash scripts/check.sh`

**Expected:**
- All pass, except if `pnpm` is missing. If `pnpm` missing, install via corepack if available or record as blocker and fix PATH safely without global destructive install.

---

### Task 7.2: Create branch and commit

**Objective:** Make the final closeout auditable in Git.

**Commands:**
- `git checkout -b factory/final-automation-closeout`
- `git add .github/pull_request_template.md scripts/factory-audit.sh scripts/local-smoke.sh scripts/*.sh`
- `git commit -m "chore(factory): complete local automation closeout"`

**Note:** Factory files are outside product repo and may not be committed to product repo unless factory itself is a Git repo. If factory is not a Git repo, record file-level evidence in `FINAL_FACTORY_CLOSEOUT_REPORT.md`.

---

### Task 7.3: Open PR

**Objective:** Route product repo changes through GitHub PR as SOP requires.

**Commands:**
- `git push -u origin factory/final-automation-closeout`
- `gh pr create --base main --head factory/final-automation-closeout --title "chore(factory): complete local automation closeout" --body-file <generated body>`

**PR body must include:**
- Goal.
- Changes.
- Validation.
- Risks.
- Rollback.
- Related run: `20260618-factory-final-closeout`.
- Keno standing authorization.

---

### Task 7.4: Verify PR Check

**Objective:** Ensure Runner is not theoretical.

**Steps:**
1. Poll PR Check status via `gh` if available.
2. If `gh` unavailable, use GitHub UI or document blocker.
3. Record result in `factory/runs/20260618-factory-final-closeout/REVIEW_REPORT.md`.

**Expected:**
- PR Check success.

---

### Task 7.5: Merge PR under standing authorization

**Objective:** Complete the product repo side of closeout.

**Condition:**
- PR Check successful.
- Local verification passed.
- No scope violations.

**Commands:**
- `gh pr merge <PR> --squash --delete-branch --subject "chore(factory): complete local automation closeout (#<PR>)"`
- `git checkout main && git pull --ff-only origin main`

**Record:**
- PR number.
- Merge commit.
- Post-merge checks.

---

## Phase 8: Final Evidence Refresh

### Task 8.1: Post-merge verification

**Objective:** Prove main is ready after merge.

**Commands:**
- `bash scripts/factory-audit.sh`
- `bash scripts/start-local.sh`
- `bash scripts/local-smoke.sh`
- `CHECK_MODE=pr bash scripts/check.sh`

**Record results:**
- Update `FINAL_FACTORY_CLOSEOUT_REPORT.md`.
- Update `PROJECT_STATUS.md`.
- Update `BLOCKERS.md`.

---

### Task 8.2: Final local runtime check

**Objective:** Leave user with a working local artifact.

**Commands:**
- `curl -fsS http://127.0.0.1:18083/api/health`
- `curl -fsS http://127.0.0.1:18085/api/health`

**Expected:**
- Both return ok.

---

## Phase 9: Final Handoff

### Task 9.1: Deliver final summary

**Objective:** Give Keno a concise final验收 handoff.

**Final response must include:**
- Final status: automation second-development factory ready / not ready.
- Local access URL.
- PR number and merge commit.
- Validation commands passed.
- Files created/updated.
- Remaining out-of-scope items.
- How to start next new tool/task through SOP.

---

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Overbuilding factory docs | Keep files practical; no huge unused process beyond SOP minimum. |
| Local `pnpm` missing | Prefer Corepack/local project package manager setup; avoid global installs unless necessary. |
| `gh` not in shell PATH | Locate installed `gh` or use documented GitHub UI evidence; fix PATH only if safe. |
| Factory files outside product repo | Treat `factory/` as control plane; product repo PR covers scripts/templates; factory evidence stays file-backed locally. |
| Production confusion returns | Add prominent local-first status and policies disabling Production. |

---

## Execution Notes

- Do not ask Keno for intermediate approval; standing authorization is recorded in `DECISIONS.md`.
- Still stop if a step requires real secrets, DB content, VPS/Production operation, destructive deletion, or unbounded install/deploy.
- Prefer small commits if implementation becomes larger than expected.
- Verify real outputs; do not fabricate runner/CI results.
