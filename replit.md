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

## Tamamlanan Özellikler (Son Güncelleme)
- GameEvent arayüzü + Room.eventLog: tüm oyun olayları (başlangıç, linç, gece ölümü, oyun sonu) kaydedilir
- EndScreen: OLAY GÜNLÜĞÜ artık eventLog'dan emoji+tur ile gösterilir
- GameContext: disconnect/reconnect/connect_error/reconnect_failed için toast bildirimler
- LobbyScreen: testID="room-code", testID="player-list", testID="host-badge" öznitelikleri eklendi
- eas.json: EAS Build konfigürasyonu oluşturuldu (Apple/Android submit parametreleri doldurulacak)
- app/join/[code].tsx: QR deeplink path-based route eklendi
- E2E: e2e/multiplayer.spec.ts iskelet testi oluşturuldu

## Bilinen Eksikler
- EAS eas.projectId doldurulacak (expo account gerektirir)
- TTS gerçek cihaz testi yapılmadı
- App Store submit bilgileri (Apple ID, ASC App ID, Team ID) eas.json'da doldurulacak
