# Davetsiz Misafir Multiplatform Release Runbook

Bu dokuman `dev`, `staging`, `production` ortamlarini ayirir ve web URL + App Store akislarini ayni kod tabaninda yonetir.

## 1) Environment Matrix

### API Server (`artifacts/api-server`)

- `PORT`: Railway tarafindan atanir.
- `NODE_ENV`: `production` (staging/prod icin).
- `CORS_ORIGIN`: virgul ile ayrilmis izinli origin listesi.
- `ROOM_TTL_HOURS`: oda yasam suresi.

Ornek:

`CORS_ORIGIN=https://staging.davetsizmisafir.app,https://davetsizmisafir.app,https://davetsiz-misafir.vercel.app`

### Mobile/Web Client (`artifacts/mahalle`)

- `EXPO_PUBLIC_API_URL`: backend base url.
- `EXPO_PUBLIC_SOCKET_URL`: Socket.IO endpoint base url.
- `EXPO_PUBLIC_DOMAIN`: legacy fallback domain.

Oncelik:
1. `EXPO_PUBLIC_SOCKET_URL`
2. `EXPO_PUBLIC_API_URL`
3. `EXPO_PUBLIC_DOMAIN`

## 2) Railway (staging API)

Repo kokunde `railway.json` dosyasi vardir. Deploy komutlari:

- Build: `pnpm --filter @workspace/api-server run build`
- Start: `pnpm --filter @workspace/api-server run start`
- Healthcheck: `/health`

Staging servisi kurulduktan sonra endpoint:

- `https://<railway-staging-domain>`

## 3) Vercel (staging web URL)

`artifacts/mahalle/vercel.json` web build ciktisini alir:

- Build: `pnpm --filter @workspace/mahalle run build:web`
- Output: `artifacts/mahalle/dist`

Vercel ortam degiskenleri:

- `EXPO_PUBLIC_API_URL=https://<railway-staging-domain>`
- `EXPO_PUBLIC_SOCKET_URL=https://<railway-staging-domain>`

Beklenen sonuc:

- `https://<vercel-staging-domain>`

## 4) Smoke Test Checklist (staging)

Iki farkli istemci (iki browser sekmesi ya da iki cihaz) ile:

1. Her iki istemci staging URL'den odaya girer.
2. Fazlar calisir: `LOBBY -> ROLE_SELECT/REVEAL -> DAY -> VOTE -> NIGHT -> ENDED`.
3. Host transfer (host cikis/geri donus) durumu stabil kalir.
4. Reconnect sonrasi state senkron kalir.
5. `/health` endpoint `status=ok` doner.

## 5) App Store / TestFlight Pipeline

`artifacts/mahalle/eas.json` production profile ile build alinir.

Gerekli kurulum:

1. `eas init` ile gercek `projectId` al.
2. Apple signing credentials bagla.
3. App Store Connect uygulamasini iliskilendir.
4. `eas build --platform ios --profile production`
5. `eas submit --platform ios --profile production`

CI ile otomasyon icin `.github/workflows/ios-testflight.yml` dosyasini kullan.
