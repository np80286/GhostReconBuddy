# Working agreement

- The user runs all tests. Provide commands and await their output; do not run tests yourself.
- Codex is authorized to run Git commands for this project, including commits and pushes. The user still runs all tests.
- Use PostgreSQL. Do not introduce SQLite or D1 as application storage.
- Do not invent game stats, compatible attachments, mission rewards, unlock routes, rankings, or coverage percentages.
- Keep Wildlands records isolated by game ID. Other games need separate ingestion and validation.
- Separate displayed game stats, measured outcomes, extracted values, derived values, and subjective claims.
- Unknown means null / undocumented, never zero or incompatible.
- Preserve sources, exact row/time references, version, platform, mode and test conditions wherever known.
- Imported catalog releases are immutable. Correct data by creating a new release.
- Use the Sites skills for website changes and the UIX skill for dense data interfaces.

## Workspace location

- Canonical project directory: `/Users/np303/dev/GhostReconBuddy`.
- `/Users/np303/Documents/ChatGPT/GhostReconBuddy` is a compatibility symlink to the same directory for existing Codex tasks. Use the canonical directory for new work.
- GitHub repository: `https://github.com/np80286/GhostReconBuddy`; primary branch: `main`.
