# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

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
