# Neighborhood Navigator — Session Context

## Active Task
Exploring persistent memory architecture and Claude Code session preservation.

## What Was Done This Session

### Vault Git Backup (COMPLETE)
- Vault at ~/Workspace/vault had NO backup — no git, no cloud sync
- Initialized git repo, pushed to private GitHub: https://github.com/jasonleinart/vault
- .gitignore set up for Obsidian (workspace cache, plugin data, logs, env files)
- Excluded embedded git repo at career/aws-saa/cantrill-course/

### Claude Code Transcript Backup (COMPLETE)
- Discovered 189 sessions, 952MB of transcript history at ~/.claude/projects/
- Oldest transcript on disk: Feb 1 — older sessions appear pruned/lost
- Built rsync-based backup: copies transcripts to vault/.claude-sessions/data/
- Script: vault/.claude-sessions/backup-transcripts.sh
- launchd agent: ~/Library/LaunchAgents/com.jasonleinart.claude-transcript-backup.plist
- Runs daily at 6am, tested and verified working
- First backup captured: 190 sessions, 709MB

### Open Brain Research (RESEARCH ONLY — NOT BUILT)
- Reviewed Nate's "Open Brain" architecture from YouTube video
- Concept: Postgres + pgvector + MCP server = LLM-agnostic persistent memory
- Capture via Slack/any input → Supabase Edge Function → embedding + metadata → Postgres
- Retrieval via MCP server → any AI client can query semantically
- Cost: ~$0.10-2.00/month depending on usage
- Decision: NOT building yet — want to observe usage patterns first before adding infrastructure

## Key Decisions
- Git over iCloud for vault backup (iCloud caused sync conflicts with Obsidian before)
- launchd over cron (Apple-compliant approach)
- Transcript backup only copies to vault — manual git push for now (no auto-push)
- Open Brain deferred — building session analysis first to diagnose actual behavior
- Vault backup uses personal GitHub account (github-personal / dspjson@gmail.com)

## Open Items / Next Steps
- **Phase 2: Session analysis** — LLM summarization layer that processes transcripts into structured markdown (decisions, patterns, insights). This is the next logical step.
- **Auto git push** — Could add vault auto-commit/push to the launchd job if manual pushing gets forgotten
- **Open Brain** — Revisit once session analysis reveals whether cross-tool memory is actually needed
- **Neighborhood Navigator deployment** — Still pending from previous sessions (see below)

## Prior Context (Neighborhood Navigator)
- Phase 1-3: COMPLETE (screener, intake, dashboard)
- Supabase project: hyeglvuolvujtphktmxk
- Next: Deploy to Vercel, enable auth, test e2e, get VCDC feedback

## Session Analysis Findings (from this session)
- 14,664 total user prompts across all sessions
- Top tools: Read (3,184), Edit (2,604), Bash (1,837)
- Vault is dominant project: 107 sessions, 9,292 messages
- Peak day: 1,575 messages (Feb 25)
- Heavy days average 500-700 messages
- Read-before-act pattern (Read #1 tool), edit > write 3:1 ratio
