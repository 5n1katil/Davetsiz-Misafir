# Davetsiz Misafir

## Overview

**Davetsiz Misafir** is a Turkish social deduction party game (Mafia-style) built as an Expo mobile app targeting App Store publishing. 4-30 players play in-person on their own phones while the host device narrates in Turkish using text-to-speech.

pnpm workspace monorepo using TypeScript. Two main artifacts:
- `artifacts/mahalle` — Expo mobile app (the game client)
- `artifacts/api-server` — Express + Socket.io game server

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 + Socket.io 4
- **Mobile**: Expo SDK 54, Expo Router, React Native 0.81
- **Realtime**: Socket.io (server at `/api/socket.io`)
- **TTS**: expo-speech (Turkish voice narration on host device)
- **Build**: esbuild (ESM bundle for api-server)

## Game Roles

| Role | Team | Night Action |
|---|---|---|
| Davetsiz Misafir | Kötü | Çete oylaması (hedef seç) |
| Tahsildar | Kötü | Çete oylaması |
| Sahte Dernek Başkanı | Kötü | Çete oylaması (linç edilirse çete anında kazanır) |
| Köylü | İyi | — |
| Muhtar | İyi | — (oyu 1.5) |
| Bekçi | İyi | Ekip sorgusu |
| Otacı Teyze | İyi | Koruma |
| Falcı | İyi | Rol sorgusu (%20 yanlış) |

## Game Phases

`LOBBY → ROLE_SELECT → ROLE_REVEAL → DAY → VOTE → NIGHT → DAY (loop) → ENDED`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm test` — run game-engine unit tests (vitest, 29 tests)
- `pnpm --filter @workspace/api-server run test` — run api-server tests directly
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/mahalle run dev` — run Expo dev server

## Testing

Unit tests live at `artifacts/api-server/src/game/__tests__/gameEngine.test.ts` (vitest).  
Config: `artifacts/api-server/vitest.config.ts`.

Covered mechanics:
- Win conditions (mahalle, çete, Kumarbaz, Kırık Kalp, Anonim, Kahraman Dede)
- Vote resolution: normal, reversed (Dedikoducu), tie/runoff, Muhtar 1.5 weight
- Politikacı instant-win on lynch (not on night kill)
- Şifacı protection saves vs. Kapıcı blocking the protector
- Kapıcı lock blocks çete attack
- Hoca one-time-use (skips when hocaUsed=true)
- Kumarbaz permanent role swap, interacting with Şifacı
- Kırık Kalp chain death (night kill and day lynch)
- Anonim 3-mark win condition

## Architecture Notes

- All game logic lives on the server (`gameEngine.ts`); client only renders state
- Socket.io path: `/api/socket.io` (proxied through the same `/api` route as REST)
- Host receives `voice` events with Turkish TTS strings; other players receive filtered `state`
- In-memory room storage (Map) — rooms are ephemeral, no database needed
- Socket reconnection: same nickname = reconnect to existing session
