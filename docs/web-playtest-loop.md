# Web Playtest Loop (App Store Hazirlik)

Bu dokumanin amaci, web uzerinden hizli test yapip bulunan sorunlari duzeltme dongusunu standartlastirmaktir.

## 1) Test URL

- Web: `https://davetsiz-misafir-web.vercel.app`
- API: `https://davetsiz-misafir-staging-production.up.railway.app`

Her test turundan once:

1. `node scripts/release-smoke.mjs --api=<api-url> --web=<web-url>`
2. `PASS` sonucunu gor
3. Sonra oyuna girip manuel senaryolari calistir

## 2) Her Turda Zorunlu Senaryolar

Minimum 2 istemci (iki tarayici sekmesi ya da iki cihaz) ile:

1. Oda acma / odaya katilma
2. Rol secimi / rol reveal
3. Day -> Vote -> Night dongusu
4. Linch + runoff durumu
5. Gece aksiyonlari (en az bir koruma/sorgu/oldurme)
6. Oyun sonu ve kazanan etiketinin dogru gosterimi

## 3) Haftalik Derin Senaryolar

1. Host disconnect / reconnect / host transfer
2. Kapici kilit etkisi
3. Hoca guclu koruma (tek kullanim)
4. Dedikoducu ters oylama
5. Anonim isaretli 3 linch kazanimi
6. Kumarbaz rol takasi sonrasi bilgi tutarliligi

## 4) Bug Rapor Formati

Her sorun icin tek satirlik kayit:

- Baslik:
- Ortam: `web-staging`
- Oda kodu:
- Oyuncu sayisi:
- Faz:
- Beklenen:
- Gerceklesen:
- Tekrar adimlari:
- Ekran goruntusu/video:
- Oncelik: `P0 | P1 | P2`

## 5) Oncelik Kurali

- `P0`: Oyun kiriliyor, oda ilerlemiyor, kazanma kosulu yanlis tetikleniyor
- `P1`: Rol yetenegi beklenenden farkli calisiyor, state tutarsiz
- `P2`: UI/metin/animasyon sorunlari

## 6) Calisma Sekli (Bundan Sonra)

1. Sen web uzerinden test et.
2. Buldugun sorunlari yukaridaki formatta bana ilet.
3. Ben tek tek duzeltip yeniden smoke + dogrulama yapayim.
4. Her tur sonunda checklisti guncelleyelim.

Bu donguyle oyunu hem hizli gelistiririz hem de App Store kalitesine kontrollu yaklasiriz.
