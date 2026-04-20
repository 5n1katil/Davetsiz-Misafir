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
41 vitest testi — tamamı geçiyor (36 gameEngine + 5 multiplayer socket).

## Roller (19 adet)
Mahalle (9): muhtar, bekci, otaci, falci, kapici, muhabir, tiyatrocu, hoca, koylu
Çete (4): tefeci_basi, tahsildar, sahte_dernek, icten_pazarlikli
Kargaşacılar (4): kumarbaz, kiskanc_komsu, kirik_kalp, dedikoducu
Yalnız Kurtlar (2): anonim, kahraman_dede

## Tamamlanan Özellikler (Son Güncelleme: #178-#183)
- #178 TS uyarıları: gameEngine.ts simulateGame() içindeki 3 tür daraltma uyarısı `(room.phase as Phase)` cast ile düzeltildi
- #179 Multiplayer socket testleri: 5 yeni vitest testi (oda kurma, disconnect/geçici host, yeniden bağlanma, 4 oyuncuyla oyun başlatma, hata yönetimi) — hepsi geçiyor
- #180 Host ayarları: RoomSettings'e `voteDurationSec` (30/45/60sn) ve `rolePackage` (standard/advanced/all) eklendi; LobbyScreen'de UI; openVote dinamik süre kullanıyor
- #181 Çete oylama UI: NightScreen'de gece aksiyonu sırasında her hedef için gerçek zamanlı oy sayısı rozeti gösterilir (yalnızca çete üyelerine görünür)
- #182 Mezarlık sohbeti iyileştirmeleri: (a) publicView yalnızca ölü oyunculara/oyun sonu sonrasına graveyardChat gönderir; (b) mesaj girişine rol emojisi ve zaman damgası eklendi; (c) canlı oyuncular yalnızca izleyici rozetini görür; (d) graveyardChat entries artık roleId içeriyor
- #183 Final: 41/41 test geçiyor, TS derleme temiz (mahalle + api-server), e2e klasörü tsconfig exclude'a eklendi

## Önceki Özellikler
- GameEvent arayüzü + Room.eventLog: tüm oyun olayları kaydedilir
- EndScreen: OLAY GÜNLÜĞÜ emoji+tur ile gösterilir
- GameContext: socket hata toast bildirimleri
- LobbyScreen: testID öznitelikleri (room-code, player-list, host-badge)
- eas.json: EAS Build konfigürasyonu
- app/join/[code].tsx: QR deeplink route

## Bilinen Eksikler
- EAS eas.projectId doldurulacak (expo account gerektirir)
- TTS gerçek cihaz testi yapılmadı
- App Store submit bilgileri (Apple ID, ASC App ID, Team ID) eas.json'da doldurulacak
