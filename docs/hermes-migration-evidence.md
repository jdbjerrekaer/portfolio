# Hermes migration evidence

This is the sanitized evidence ledger for the Hermes case study. It is intentionally descriptive rather than operational: no secrets, tokens, credentials, private IPs, personal messages, or service API details belong here.

## Current source of truth

- Portfolio checkout: the live portfolio repository on GX10
- Hermes runtime: the user's Hermes home on GX10
- Hermes source checkout: the Hermes-agent repository on GX10
- Historical OpenClaw material: the archived OpenClaw memory bridge under the Hermes vault
- VKSNAS: reachable through the private ZeroTier network; direct SSH was not authenticated during this research pass, so NAS claims use the archived OpenClaw evidence and user-provided topology

## Timeline

| Date | Evidence | Claim | Confidence |
| --- | --- | --- | --- |
| 2026-03-06 to 2026-03-08 | Archived OpenClaw project and migration notes | OpenClaw still owned the runtime; memory structure and ARR integration were being actively developed | High |
| 2026-05-20 | Archived OpenClaw session memory | OpenClaw was actively diagnosing and operating the NAS ARR stack | High |
| 2026-06-20 16:40 | Hermes-agent checkout and installation file timestamps | Hermes was installed/initialized on GX10 | High |
| 2026-06-20 23:46–23:48 | Timestamped Hermes cutover configuration backups | A Hermes cutover/configuration transition occurred | High |
| 2026-06-20 23:47 | First Hermes request dump timestamp | Hermes was handling live work immediately around the cutover | High |
| 2026-06-22 | Archived OpenClaw vault copied/indexed on GX10 | OpenClaw evidence was preserved for migration and retrieval | High |

The case study uses **20 June 2026** as the cutover date, while describing the transition as staged rather than claiming that every workflow switched at one instant.

## Verified Hermes capabilities

- Local OpenAI-compatible model endpoint and profile-based configuration
- Camofox browser configuration and browser-backed Google research path
- DeepPlan skill and DeepResearch/web-research skills
- Sonarr and Radarr manual-import skills plus Jellyseerr request tooling
- Memory, skills, cron, profile, gateway, and security configuration
- Home Assistant platform/toolset surface present, but not a verified live home-control workflow
- Dedicated OpenClaw-to-Hermes migration skill with dry-run and compatible user-data import paths

## Verified historical OpenClaw capabilities

- OpenClaw runtime and workspace evidence archived under the Hermes vault
- Structured memory migration work dated 2026-03-08
- ARR/media workflows covering Sonarr, Radarr, Prowlarr, Jellyseerr, qBittorrent, Jellyfin, Bazarr, FlareSolverr, and ErsatzTV
- Real import, path, permissions, subtitle, and network troubleshooting notes
- OpenClaw runtime-operations notes covering restart durability and rollback/circuit-breaker behavior

## Claim guardrails

- Describe VKSNAS as the former OpenClaw host and current ARR/media host; do not imply Hermes moved the ARR data.
- Describe ZeroTier as the private network path; do not publish addresses or topology details.
- Describe Camofox as browser compatibility and interactive search infrastructure; do not claim it defeats access controls.
- Describe Claude Sonnet 4.0 as a coding route used for minor tasks, not as Hermes’ current default model.
- Describe Home Assistant as planned/not yet operational.
- Avoid public metrics unless a separate source can verify them.
