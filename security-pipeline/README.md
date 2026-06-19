# Security Testing Pipeline

Automated security testing for the 20 AI-generated applications in `Génération_Code_Application`, aligned with the methodology in `Projet_1_Rapport_anglais/main.tex`.

## Tools

| Layer | Tool | Purpose |
|-------|------|---------|
| A06 | npm audit + pip-audit | Dependency inventory and CVE detection |
| DAST | OWASP ZAP (Docker) | Baseline + authenticated active scans on running apps |
| Scripted probes | `run-manual-probes.ps1` (M1–M16) | Access control, business logic, multipart uploads, CWE-specific tests |
| SAST (optional) | SonarQube Community (Docker) | Source-code vulnerabilities — **not run by default** |

## Prerequisites

- Docker Desktop
- Node.js 20+ and npm
- Python 3.11+ with `pip install pip-audit`
- PowerShell 5.1+

## First-time setup

1. **Resolve application paths** (required on Windows when the folder name contains accents):

   ```powershell
   cd Cyber_Special_Project\security-pipeline
   .\scripts\setup-paths.ps1
   ```

   This writes `config\apps-root.txt` with the absolute path to `Génération_Code_Application`.

2. Pull ZAP image (optional — pulled automatically on first scan):

   ```powershell
   docker pull ghcr.io/zaproxy/zaproxy:stable
   ```

### Optional: SonarQube SAST

Only needed if you pass `-RunSonar`:

1. `.\scripts\static\start-sonar.ps1`
2. Open http://localhost:9000 — login `admin` / `admin`, change password when prompted.
3. Create a user token (My Account → Security → Generate Token).
4. Copy `config\.env.example` to `config\.env` and set `SONAR_TOKEN=your_token_here`
5. `docker pull sonarsource/sonar-scanner-cli`

## Usage

### Full pipeline (all 20 apps, sequential)

```powershell
cd Cyber_Special_Project\security-pipeline
.\scripts\run-all.ps1
```

### Single app

```powershell
.\scripts\run-all.ps1 -App "Opus_NovaNest"
```

### ZAP only (app must be started separately or via pipeline)

```powershell
.\scripts\run-all.ps1 -App "Opus_NovaNest" -SkipDeps -SkipManual
```

### Partial runs

```powershell
# Dependencies only (no app startup)
.\scripts\static\collect-dependencies.ps1 -AppName "Opus_NovaNest"
.\scripts\static\scan-dependencies.ps1 -AppName "Opus_NovaNest"

# Dynamic + manual only
.\scripts\run-all.ps1 -App "Opus_NovaNest" -SkipDeps

# Include optional SonarQube SAST
.\scripts\run-all.ps1 -RunSonar -StartSonar
```

### Flags

| Flag | Effect |
|------|--------|
| `-App "Name"` | Run for one application only |
| `-RunSonar` | Include SonarQube SAST scan (off by default) |
| `-StartSonar` | Start SonarQube container before scanning (use with `-RunSonar`) |
| `-SkipDeps` | Skip dependency inventory and CVE scan |
| `-SkipZap` | Skip OWASP ZAP |
| `-SkipManual` | Skip manual probes |
| `-SkipInstall` | Skip `npm install` on app startup |

## ZAP scans

Each app with a running dev server gets two DAST passes:

1. **Baseline** (`zap/baseline-report.html`) — unauthenticated spider + passive rules via the ZAP Automation Framework.
2. **Authenticated** (`zap/auth-report.html`) — logs in as admin (JSON `requestor` job, or NextAuth cookie injection), then spider + **active scan**.

Reports use relative paths inside the Docker volume (`reportFile: baseline-report.html`) to avoid the `/zap/wrk/zap/wrk/` path-doubling bug.

Astro/Next.js/FastAPI dev servers receive a `Host: localhost` header override so Docker can reach apps bound on `0.0.0.0`.

## Output structure

```
results/
├── summary.csv              # Per-app metrics
├── summary.md               # Human-readable overview
├── a06-master-inventory.csv # All dependencies across corpus
├── a06-cve-matrix.csv       # All CVEs across corpus
├── manual-matrix.csv        # M1–M16 × 20 apps
└── {AppName}/
    ├── sonar/               # issues.json, summary.json (only with -RunSonar)
    ├── dependencies/        # inventory.csv, cves.csv, audit-summary.json
    ├── zap/                 # baseline-report.html, auth-report.html, *-alerts.json
    ├── manual/              # checklist.json, endpoints.json
    └── logs/                # App startup logs
```

## Manual test checklist (M1–M16)

| ID | Domain | Covers |
|----|--------|--------|
| M1–M3 | Access control | A01 |
| M4–M5 | Session & auth | A07, A05 |
| M6–M7 | Injection | A03 |
| M8–M9 | Business logic | A04, CWE-362 |
| M10–M11 | Path & filename | CWE-22, CWE-98 |
| M12–M13 | Resource limits | CWE-400, A08 |
| M14 | SSRF | A10 |
| M15–M16 | Logging & cleanup | A09, CWE-459 |

Tests M11–M16 use `curl.exe` for multipart uploads and filesystem inspection under each app root (see `scripts/lib/UploadHelper.ps1`).

## App manifest

Application metadata (ports, credentials, feature flags) lives in `config/apps.manifest.json`. Update this file if seed credentials or ports change.

## Estimated runtime

- Dependencies: ~1–2 min per app
- ZAP baseline + auth: ~10–15 min per app
- Manual probes: ~1 min per app
- **Full corpus (default pipeline)**: ~4–6 hours — run overnight or batch by LLM model

## Troubleshooting

- **Port in use**: Ensure no other app is running; pipeline stops each app before starting the next.
- **SonarQube API export fails**: Check `SONAR_TOKEN` in `config/.env` and that the scanner finished (`results/{App}/sonar/scanner.log`).
- **pip-audit not found**: `pip install pip-audit`
- **ZAP cannot reach app**: ZAP uses `host.docker.internal` — requires Docker Desktop on Windows. Apps must bind to `0.0.0.0` (handled by `Start-App.ps1`).
- **ZAP 403 on Astro/Next.js**: Host header override is in `config/zap/*.yaml` via `ZapHelper.ps1`. Check `results/{App}/zap/baseline.log`.
- **Missing HTML report**: Ensure `reportFile` in the automation plan is a filename only (e.g. `baseline-report.html`), not `/zap/wrk/baseline-report.html`.
