# Davetsiz Misafir

Türkçe sosyal çıkarım parti oyunu (Mafya benzeri).
Expo mobile app, App Store hedefli.

## Stack
- pnpm monorepo, TypeScript 5.9, Node 24
- api-server: Express 5 + Socket.io 4 (port 8080)
- mahalle: Expo SDK 54, Expo Router, React Native 0.81

## Çalıştırma
- API server: pnpm --filter @workspace/api-server run dev
- Mobile: pnpm --filter @workspace/mahalle run web
- Tests: pnpm --filter @workspace/api-server run test

## Test Durumu
36 vitest testi — tamamı geçiyor.

## Roller (19 adet)
Mahalle (9): muhtar, bekci, otaci, falci, kapici, muhabir, tiyatrocu, hoca, koylu
Çete (4): tefeci_basi, tahsildar, sahte_dernek, icten_pazarlikli
Kargaşacılar (4): kumarbaz, kiskanc_komsu, kirik_kalp, dedikoducu
Yalnız Kurtlar (2): anonim, kahraman_dede

## Bilinen Eksikler
- E2E test yok (NightScreen, EndScreen, linç akışı)
- TTS gerçek cihaz testi yapılmadı
- App Store hazırlığı eksik (app.json, icon, splash, privacy manifest)
