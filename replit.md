# Davetsiz Misafir

Türkçe sosyal çıkarım parti oyunu (Mafya benzeri).
Expo mobile app, App Store hedefli.

## Stack
- pnpm monorepo, TypeScript 5.9, Node 24
- api-server: Express 5 + Socket.io 4 (port 8080)
- mahalle: Expo SDK 54, Expo Router, React Native 0.81

## Çalıştırma
- API server: pnpm --filter @workspace/api-server run dev
- Mobile: pnpm --filter @workspace/mahalle run dev  (expo start --offline)
- Tests: pnpm --filter @workspace/api-server run test

## Test Durumu
52 vitest testi — tamamı geçiyor (46 gameEngine + 6 multiplayer socket).

## Roller (19 adet)
Mahalle (9): komsu, muhtar, bekci, otaci, falci, kapici, muhabir, tiyatrocu, hoca
Çete (4): tefeci_basi, tahsildar, sahte_dernek, icten_pazarlikli
Kargaşacılar (4): kumarbaz, kiskanc_komsu, kirik_kalp, dedikoducu
Yalnız Kurtlar (2): anonim, savas_gazisi_dede

Komşu (🏠) — standart masum rol, her zaman havuza dolgu olarak eklenir, oyun evreninin temel karakteridir.

## Tamamlanan Özellikler
- Komşu rolü: `koylu`/`Mahalle Sakini` tamamen kaldırıldı; id=`komsu`, Komşu 🏠 olarak yeniden adlandırıldı. Her iki frontend (constants/roles.ts) ve backend (roles.ts) güncellendi. HowToPlay ve tüm ekranlarda ilk rol olarak gösterilir.
- Rol dağılım tablosu: 4-30 oyuncu için tam tablo; kötü her zaman iyi'den az başlar.
- buildRolePool: ROLE_DISTRIBUTION tablosuna göre havuz oluşturur; kalan slotları Komşu ile doldurur.
- checkWin: kaos/tarafsız roller evil/good sayısına dahil edilmez.
- LobbyScreen dağılım önizlemesi: disabledRoles ve player count'a göre dinamik güncellenir.
- Kargaşacı/Yalnız Kurt kategorileri: oyuncu sayısı yetersizse (7/<14) toggle yerine bilgi mesajı gösterir.
- RoleSelectScreen oyuncu numaraları: OYUNCU01/02... sıralı, boşluksuz (dizi indexi kullanır).
- RoleSelectScreen anonim isimlendirme: roleSelectPosition yerine displayIndex gösterir.
- HostSettings: dağılım önizleme kartı, zamanlama, rol paketi, rol toggle accordion.
- Mezarlık sohbeti: sadece ölü oyunculara/oyun sonu açık.
- Oylama süresi (voteDurationSec 30/45/60sn) ve rol paketi (standard/advanced/all) ayarları.
- Çete oylama: gerçek zamanlı oy sayısı rozeti (NightScreen).
- Socket reconnect / geçici host değişimi.
- GameEvent arayüzü + eventLog: EndScreen'de OLAY GÜNLÜĞÜ gösterilir.
- EAS Build konfigürasyonu (eas.json).
- QR deeplink route (app/join/[code].tsx).

## Dosya Yapısı
artifacts/api-server/src/game/
  gameEngine.ts  — 2199 satır (tüm oyun mantığı)
  roles.ts       — ~515 satır (19 rol + ROLE_DISTRIBUTION + buildRolePool)
  socket.ts      — 328 satır (Socket.io event handler)
  __tests__/gameEngine.test.ts   — 46 test
  __tests__/multiplayer.test.ts  — 6 test

artifacts/mahalle/
  app/index.tsx              — root, phase routing
  contexts/GameContext.tsx   — socket bağlantısı, state
  screens/LobbyScreen.tsx    — lobi + HostSettings accordion
  screens/RoleSelectScreen.tsx
  screens/RoleRevealScreen.tsx
  screens/DayScreen.tsx
  screens/VoteScreen.tsx
  screens/NightScreen.tsx
  screens/EndScreen.tsx
  screens/SettingsScreen.tsx
  screens/HowToPlayScreen.tsx
  screens/StatsScreen.tsx
  constants/roles.ts         — frontend RoleDef + ROLE_DEFS (19 rol)

## Bilinen Eksikler
- EAS eas.projectId doldurulacak (expo account gerektirir)
- TTS gerçek cihaz testi yapılmadı (expo-speech web'de çalışmaz)
- App Store submit bilgileri (Apple ID, ASC App ID, Team ID) eas.json'da doldurulacak
