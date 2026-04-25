# Davetsiz Misafir App Store Readiness Checklist (v1)

Bu kontrol listesi, oyunu iOS App Store'a yayinlamadan once teknik, urun ve operasyonel hazirligi netlestirmek icin hazirlandi.

Durum etiketleri:
- `[OK]` Hazir
- `[IN_PROGRESS]` Kismen hazir / netlestirme gerekiyor
- `[TODO]` Henuz yapilmadi

## 1) Build ve Dagitim

- `[OK]` `app.json` icinde `ios.bundleIdentifier` tanimli: `com.davetsizmisafir.app`
- `[OK]` `eas.json` icinde `development`, `preview`, `production` profilleri var
- `[IN_PROGRESS]` `app.json` icinde `extra.eas.projectId` hala placeholder: `FILL_IN_AFTER_EAS_INIT`
- `[TODO]` Apple Team / signing credentials dogrulanmali (EAS tarafinda)
- `[TODO]` Production iOS build alip TestFlight'a yukleme akisi tamamlanmali

## 2) Ortam ve Altyapi

- `[OK]` Web deploy + backend staging URL akisi dokumante edildi (`docs/multiplatform-release.md`)
- `[OK]` API tarafinda health endpoint ve CORS coklu origin modeli mevcut
- `[IN_PROGRESS]` Production API URL degerleri release pipeline'da tek kaynak (single source of truth) haline getirilmeli
- `[TODO]` Release oncesi canli endpoint smoke testi otomatiklestirilmeli (`/health`, socket baglantisi, oda olusturma)

## 3) Oyun Kurallari ve Denge

- `[OK]` Faz akisi backend'de net: `LOBBY -> ROLE_SELECT/ROLE_REVEAL -> DAY -> VOTE -> NIGHT -> ENDED`
- `[OK]` Rol gruplari ve ozel kazanma kosullari engine seviyesinde tanimli (`iyi`, `kotu`, `kaos`, `tarafsiz`)
- `[OK]` Oyuncu sayisina gore rol dagilimi ve denge kontrolu mevcut
- `[IN_PROGRESS]` App Store release icin "rekabet dengesi" test matrisi cikartilmali (4-30 oyuncu, farkli rol paketleri)
- `[TODO]` Her kritik kazanma kosulu icin otomatik test kapsam tablosu dokumante edilmeli

## 4) Mobil Kalite ve Cihaz Testi

- `[OK]` iOS metadata temel alanlari mevcut (`buildNumber`, `supportsTablet`, encryption flag)
- `[IN_PROGRESS]` Expo Go sadece hizli UI denemeleri icin kullanilmali; final dogrulama icin Development Build + TestFlight zorunlu
- `[TODO]` Gercek cihaz test matrisi hazirlanmali:
  - eski/yeni iPhone modelleri
  - zayif ag (3G/packet loss) senaryolari
  - arkaplan/geri donus ve reconnect akislari
- `[TODO]` Uzun sureli multiplayer soak test (en az 30-45 dk oda) uygulanmali

## 5) Store Compliance ve Icerik

- `[IN_PROGRESS]` Gizlilik metni ve App Privacy cevaplari netlestirilmeli (hangi veriler toplanir/saklanir)
- `[TODO]` App Store urun sayfasi varliklari hazirlanmali:
  - ikon final paketi
  - iPhone ekran goruntuleri
  - tanitim metni, alt baslik, anahtar kelimeler
- `[TODO]` Yas derecelendirme (violence/fear/simulated gambling dilinin etkisi) degerlendirmesi yapilmali
- `[TODO]` Kullanici destek URL ve gizlilik politikasi URL'leri yayina hazir olmali

## 6) Go-Live Oncesi Zorunlu Testler

- `[TODO]` 2 istemci smoke test:
  - oda kurma / katilma
  - gun-gece dongusu
  - linch / runoff / oyun sonu
- `[TODO]` Host transfer + reconnect senaryolari (host ayrilma/geri donus)
- `[TODO]` Ozel rol regressions:
  - Kapici kilit etkisi
  - Hoca tek-kullanim guclu koruma
  - Dedikoducu ters oylama
  - Anonim 3 isaretli linch kazanimi
- `[TODO]` Session crash / yeniden giris sonrasi state tutarliligi
- `[OK]` Yari otomatik smoke komutu eklendi: `pnpm smoke:release -- --api=<api-url> --web=<web-url>`

## 7) En Yakin Aksiyon Plani (Sira Oncelikli)

1. `eas init` ile gercek `projectId` al ve `app.json`'a yaz.
2. Development build alip fiziksel iPhone'da baglanti ve gece aksiyonlarini test et.
3. TestFlight `production` build + submit adimini calistir.
4. Release smoke checklist'ini CI veya komut script'i ile yarim otomatik hale getir.
5. App Store metadata + privacy policy + support URL paketini tamamla.

## 8) Expo Go Karari (Net)

- Expo Go: hizli prototip ve UI akis testleri icin **uygun**.
- App Store release kalitesi: **tek basina yetersiz**.
- Zorunlu final katman: **EAS Development Build + TestFlight**.

## 9) Aktif Gelistirme Modu

- Web tabanli hizli test + duzeltme dongusu aktif.
- Standart surec: `docs/web-playtest-loop.md`
