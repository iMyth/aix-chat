# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.4] - 2025-07-23

### Fixed
- **i18n zero-config**: ChatApp now works without manual `app.use(i18n)` setup. Components use `useChatI18n()` which falls back to built-in `en`/`zh` locales if the consumer app hasn't installed vue-i18n
- Moved `vue-i18n` from `peerDependencies` to `dependencies` — `npm install aix-chat` is all that's needed
- `mountChat()` now auto-registers i18n on the app instance
- Added `vue-i18n` to Vite `external` list to prevent duplicate bundling

### Added
- Exported `CardMap` and `CardRegistry` types from index

## [1.0.3] - 2025-07-23

### Added
- Backend integration guide with Vercel AI SDK reference implementation in all READMEs
- Bilingual READMEs (en + zh-CN) with cross-links

### Fixed
- Server: added CORS headers to streaming response (`reply.hijack()` bypasses Fastify `onSend` hook)
- Server: replaced `convertToModelMessages` with direct message mapping for AI SDK v7 compatibility

## [1.0.2] - 2025-07-23

### Fixed
- Docker Compose healthcheck: added `-d aix_chat` to `pg_isready`
- Demo: removed compiled `.js` artifacts from git, added `packages/demo/.gitignore`
- `.env.example` now matches actual server code (`DASHSCOPE_API_KEY` instead of `OPENAI_API_KEY`)

## [1.0.1] - 2025-07-23

### Fixed
- Fixed `vue` listed in both `dependencies` and `peerDependencies`, which caused duplicate Vue instance errors for consumers
- Moved `vue-i18n`, `ai`, `@ai-sdk/vue` to `peerDependencies` to prevent version conflicts
- Removed unused `pinia` from `dependencies`
- Fixed skill template paths (`@/chat` → `aix-chat`) that were broken after `npm install`
- Fixed postinstall script: now only runs when consumer project has a `.claude` directory
- Added `SKIP_AIX_SKILLS=1` env var to opt out of auto-linking
- Fixed `.env.example` to match actual server code (`DASHSCOPE_API_KEY` instead of `OPENAI_API_KEY`)

### Added
- MIT `LICENSE` file
- `keywords`, `license`, `author` fields in `package.json`
- Bilingual postinstall output (English)
- `CHANGELOG.md`

## [1.0.0] - 2025-07-22

### Added
- Initial release
- `ChatApp` component — full-featured AI chat UI
- `defineTools()` — tool & card definition API
- `mountChat()` — one-liner DOM mount
- `createChat()` — headless chat logic for custom UIs
- Streaming responses via AI SDK v7
- Voice input with hold-to-talk
- Image upload with paste support
- Light/dark/auto theme
- Claude Code Skills for AI-assisted integration
- Card component system with pending/completed states
