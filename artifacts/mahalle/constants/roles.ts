export interface RoleDef {
  id: string;
  name: string;
  emoji: string;
  team: "iyi" | "kotu" | "kaos" | "tarafsiz";
  description: string;
  story: string;
  ability: string;
  winCondition: string;
  tips: string[];
  voteWeight: number;
  nightActionDescription?: string;
  shortDesc?: string;
}

export const ROLE_DEFS: Record<string, RoleDef> = {
  // ── MAHALLE TAKIMI ─────────────────────────────────────────────────────────
  muhtar: {
    id: "muhtar",
    name: "Muhtar",
    emoji: "🎖️",
    team: "iyi",
    description: "Mahallenin resmi sözcüsü. Oyu 1.5 sayılır — bu herkes tarafından bilinir.",
    story: "Her sabah kahvede oturur, kararı o verir. Mührü cebinde, otoritesi sözünde. Ama herkesin bildiği güç, çetenin de dikkatini çeker.",
    ability:
      "Oylama gücün 1.5'tir. Bu durum tüm oyuncular tarafından bilinir; çete seni birincil hedef alabilir. Özel bir gece eylemin yoktur.",
    winCondition:
      "Tüm çete üyeleri ve tehlikeli tarafsızlar (Anonim, Kahraman Dede) etkisiz hale getirilmeli.",
    tips: [
      "Kimliğini hemen açıklama; çete ilk turda seni hedef alır.",
      "Oylama gücünü doğru anda, doğru kişi için kullan.",
      "Bekçi ve Falcı'nın ipuçlarını birleştir, güvenilir listeyi sen oluştur.",
    ],
    voteWeight: 1.5,
    nightActionDescription: "Bu gece yapacak bir eylemin yok. Oyun açık: herkes senin 1.5 oy ağırlığını biliyor.",
    shortDesc: "Oylamalarda 1.5 oy hakkı var, gücü herkese açık.",
  },
  bekci: {
    id: "bekci",
    name: "Bekçi",
    emoji: "🔦",
    team: "iyi",
    description: "Geceleri devriye gezer. Bir kişinin ekibini öğrenir — Mahalle mi, Çete mi?",
    story: "Düdüğü boynunda, feneri elinde. Her gece bir kapıyı çalar; içeri kim varsa ekibini anlar. Ama bazı kapılar kilitlidir.",
    ability:
      "Her gece bir oyuncu seçersin. Sabah o kişinin 'Mahalle' mi yoksa 'Çete' mi olduğunu öğrenirsin. İçten Pazarlıklı seni yanıltır ve 'Mahalle' sonucu döndürür. Hedefin evi kilitliyse sorgu başarısız olur.",
    winCondition:
      "Tüm çete üyeleri elenirse ve tehlikeli tarafsızlar (Anonim, Kahraman Dede) temizlenirse mahalle kazanır.",
    tips: [
      "Bulguları hemen açıklama; çete kimi temizleyeceğini öğrenir.",
      "Şüpheli iki oyuncudan birini sorgula, ikinci gece diğerini kontrol et.",
      "İçten Pazarlıklı seni 'Mahalle' olarak yanıltır — bilgin kesin değildir.",
    ],
    voteWeight: 1,
    nightActionDescription: "Seçtiğin kişinin Mahalle mi, Çete mi olduğunu öğrenirsin.",
    shortDesc: "Gece bir kişinin iyi mi kötü mü olduğunu öğrenir.",
  },
  otaci: {
    id: "otaci",
    name: "Şifacı Teyze",
    emoji: "🌿",
    team: "iyi",
    description: "Her gece bir kişiyi çetenin saldırısından korur. Aynı kişiyi üst üste iki gece koruyamaz.",
    story: "Çantasında ada çayı, kekik, biberiye. Hangi kapıyı çalsa o kişi sabah sapasağlam uyanır. Ama her evin önünde her gece duramaz.",
    ability:
      "Her gece bir oyuncuyu korursun. Koruduğun kişiye çete saldırırsa hayatta kalır. Aynı kişiyi arka arkaya iki gece koruyamazsın. Oyun boyunca yalnızca bir kez kendinle koruma yapabilirsin.",
    winCondition:
      "Tüm çete üyeleri elenirse ve tehlikeli tarafsızlar (Anonim, Kahraman Dede) temizlenirse mahalle kazanır.",
    tips: [
      "Aktif konuşan ve iyi rolden olduğundan şüphelendiğin oyuncuları koru.",
      "Aynı kişiyi arka arkaya koruma; çete bir sonraki geceyi bekler.",
      "Kendini koruma hakkını sakla — en tehlikeli ana denk getir.",
    ],
    voteWeight: 1,
    nightActionDescription: "Seçtiğin kişiyi bu gece çete saldırısından korursun.",
    shortDesc: "Her gece bir kişiyi çete saldırısından korur.",
  },
  falci: {
    id: "falci",
    name: "Falcı",
    emoji: "🔮",
    team: "iyi",
    description: "Fincan açar, kader okur. Tam rol adını görür — ama %20 ihtimalle yanlış sonuç gelir.",
    story: "Türk kahvesi içsin, fincanı çevir. Falda ne çıkarsa o kişinin gerçeğidir… çoğunlukla. Her vizyon bir ipucu taşır, ama her ipucu doğru değildir.",
    ability:
      "Her gece bir oyuncu seçersin. Sabah o kişinin tam rolünü öğrenirsin. Her sorguda %20 ihtimalle yanlış rol görünür; bu durum sana bildirilmez. Hedefin evi kilitliyse sorgu başarısız olur.",
    winCondition:
      "Tüm çete üyeleri elenirse ve tehlikeli tarafsızlar (Anonim, Kahraman Dede) temizlenirse mahalle kazanır.",
    tips: [
      "Önce sessiz ve şüpheli oyuncuları sorgula.",
      "Bilgini kesin kanıt değil ipucu olarak sun; %20 hata payını unutma.",
      "Aynı kişiyi iki ayrı gece sorgulayarak sonucu doğrulayabilirsin.",
    ],
    voteWeight: 1,
    nightActionDescription: "Seçtiğin kişinin tam rolünü öğrenirsin (bazen yanıltıcı olabilir).",
    shortDesc: "Bir kişinin tam rolünü öğrenir, ama bazen yanılır.",
  },
  kapici: {
    id: "kapici",
    name: "Kapıcı",
    emoji: "🧹",
    team: "iyi",
    description: "Her gece bir evi kilitler. Kilitlenen eve gece hiç kimse giremez.",
    story: "Her anahtarın bir sırrı var. Bu gece hangi kapıyı kapatırsan o kapı hem dışarıya hem içeriye kapanır. Ama Hoca'nın duası kapı tanımaz.",
    ability:
      "Her gece bir oyuncunun evini kilitlersin. Kilitlenen eve çete saldıramaz, Bekçi sorgulayamaz, Şifacı Teyze koruyamaz, Falcı bakamaz. Hoca'nın güçlü koruması kilidi aşar. Kendi evini kilitleyemezsin. Her sabah hangi rollerin o evi ziyaret etmeye çalıştığını özel olarak öğrenirsin.",
    winCondition:
      "Tüm çete üyeleri elenirse ve tehlikeli tarafsızlar (Anonim, Kahraman Dede) temizlenirse mahalle kazanır.",
    tips: [
      "Çetenin hedef alabileceği önemli oyuncuları kilitle.",
      "Bekçi veya Şifacı Teyze ile zımni koordinasyon kur; onlar başka birine baksın.",
      "Sabah aldığın özel özeti dikkatle oku — kimin saldırdığını ima eder.",
    ],
    voteWeight: 1,
    nightActionDescription: "Seçtiğin kişinin evini kilitlersin — bu gece kimse giremez.",
    shortDesc: "Bir evi kilitler, o gece kimse giremez.",
  },
  muhabir: {
    id: "muhabir",
    name: "Muhabir",
    emoji: "📰",
    team: "iyi",
    description: "Özel gece eylemi yoktur. Öldüğünde biriktirdiği tüm bilgiler tüm oyunculara açıklanır.",
    story: "Masasındaki dosyalar her gece kalınlaşır; gözlemler, şüpheler, isimler. Kimseye söylemez — ama ölürse kapağı uçar ve herkes öğrenir.",
    ability:
      "Özel bir gece eylemin yoktur. Öldüğünde (gece saldırısı veya linç) o ana kadar oyun içinde biriktirilen tüm bilgiler otomatik olarak tüm oyunculara açıklanır. Bu durum çetenin seni susturmak istemesine neden olur.",
    winCondition:
      "Tüm çete üyeleri elenirse ve tehlikeli tarafsızlar (Anonim, Kahraman Dede) temizlenirse mahalle kazanır.",
    tips: [
      "Gündüz tartışmalarında ince ipuçları bırak — ölürsen mirasın değer kazanır.",
      "Çete seni erkenden susturmak ister; dikkatli ol.",
      "Öldüğün ana kadar topladığın bilgi tüm mahalleye kalır — boşa harcama.",
    ],
    voteWeight: 1,
    nightActionDescription: "Bu gece yapacak bir eylemin yok. Uyku modundasın — ama ölürsen tüm bildiklerin herkese açılır.",
    shortDesc: "Ölünce tüm topladığı bilgiler herkese açılır.",
  },
  tiyatrocu: {
    id: "tiyatrocu",
    name: "Şehir Tiyatrocusu",
    emoji: "🎭",
    team: "iyi",
    description: "Öldüğünde gerçek rolü değil, rastgele atanmış sahte bir rol açıklanır.",
    story: "Hayat bir sahnedir ve o en iyi oyuncudur. Ölümü bile bir perde kapanışıdır — seyirciler gerçeği hiç öğrenemez.",
    ability:
      "Oyun başında sana rastgele bir 'sahte rol' atanır. Öldüğünde — ister gece saldırısıyla ister lincle — tüm oyunculara gerçek rolün değil bu sahte rol gösterilir. Gerçek rolünü yalnızca host görebilir.",
    winCondition:
      "Tüm çete üyeleri elenirse ve tehlikeli tarafsızlar (Anonim, Kahraman Dede) temizlenirse mahalle kazanır.",
    tips: [
      "Sahte rolünü aklında tut; davranışlarını o role göre şekillendir.",
      "Çete seni sahte rola göre hedef alabilir — bu seni aslında koruyabilir.",
      "Gerçek rolünü asla açıklama; tek gücün öldükten sonra ortaya çıkar.",
    ],
    voteWeight: 1,
    nightActionDescription: "Bu gece yapacak bir eylemin yok. Ama unutma: öldüğünde gerçek rolün değil, sahte rolün açıklanır.",
    shortDesc: "Ölünce gerçek rolü değil sahte rolü görünür.",
  },
  hoca: {
    id: "hoca",
    name: "Hoca",
    emoji: "📿",
    team: "iyi",
    description: "Tek kullanımlık güçlü koruma. Kapıcı kilidini ve Kahraman Dede'yi bile geçer.",
    story: "Bir duası vardır. Bir kez eder. Kime ettiyse o gece hiçbir tehlike dokunamaz — kilidi bile kırar, Kahraman Dede'yi bile püskürtür.",
    ability:
      "Oyun boyunca yalnızca bir kez bir oyuncuyu korursun. Bu koruma Kapıcı kilidini aşar ve Kahraman Dede'nin bağımsız saldırısını da engeller. Kullandıktan sonra sıradan bir mahalle sakinine dönüşürsün ve her gece 'Tamam' diyerek geçersin.",
    winCondition:
      "Tüm çete üyeleri elenirse ve tehlikeli tarafsızlar (Anonim, Kahraman Dede) temizlenirse mahalle kazanır.",
    tips: [
      "Tek kullanımlık — çarçabuk harcama, doğru anı bekle.",
      "Bekçi veya Falcı gibi kritik bilgi sahibi rolleri korumayı düşün.",
      "Yanlış kişiye kullanırsan çete üyesini korumuş olabilirsin.",
    ],
    voteWeight: 1,
    nightActionDescription: "Tek kullanımlık güçlü korumanı bu gece kime kullanacaksın?",
    shortDesc: "Bir kez, hiçbir engeli aşan güçlü koruma kullanır.",
  },
  koylu: {
    id: "koylu",
    name: "Mahalle Sakini",
    emoji: "🏘️",
    team: "iyi",
    description: "Sıradan bir mahalle sakini. Özel gece eylemi yoktur; gündüz oylaması tek silahıdır.",
    story: "Sabah simit alır, akşam balkonda muhabbet. Dedikodu çoğu zaman gerçeği taşır — doğru soruyu soran kişi farkı yaratır.",
    ability:
      "Özel bir gece eylemin yoktur. Tüm gücün gündüz tartışmasında ve oylamadadır. Söz al, soru sor, şüphelilerini öne çıkar.",
    winCondition:
      "Tüm çete üyeleri elenirse ve tehlikeli tarafsızlar (Anonim, Kahraman Dede) temizlenirse mahalle kazanır.",
    tips: [
      "Konuş, dinle, soru sor — sessiz kalmak şüphe çeker.",
      "Çelişkili açıklama yapan oyuncuları not al, gündüz öne çıkar.",
      "Bekçi ve Falcı'yı destekle; bilgilerini doğrulamak için oy gücünü kullan.",
    ],
    voteWeight: 1,
    nightActionDescription: "Bu gece yapacak bir eylemin yok. Gündüz tartışması ve oylaması senin en güçlü silahın.",
    shortDesc: "Özel yeteneği yok ama oylaması hayat kurtarır.",
  },

  // ── DAVETSİZ MİSAFİR ÇETESİ ───────────────────────────────────────────────
  tefeci_basi: {
    id: "tefeci_basi",
    name: "Davetsiz Misafir",
    emoji: "🚪",
    team: "kotu",
    description: "Kimse onu davet etmedi. Ama o burada. Ve her gece biri kayboluyor.",
    story:
      "Geçen ay taşındı. Kapıda kibarca güldü, elini sıktı. Ama o gülümseme hiç gözlerine yansımadı. Elindeki anahtar — binada o numaralı daire yok.",
    ability:
      "Her gece ekibinle birlikte bir hedef seçersiniz. Çoğunluk kararı geçer; o kişi sabah kaybolur. Şifacı Teyze veya Hoca koruması saldırıyı engeller. Kapıcı kilidi de saldırıyı bloke eder.",
    winCondition:
      "Hayatta kalan çete üyelerinin sayısı, mahalle ve diğer tüm oyuncuların sayısına eşitlenirse veya geçerse mahalle ele geçirilir.",
    tips: [
      "Sakin ol; çok konuşan değil, doğru anda konuşan kazanır.",
      "Ekip arkadaşını fazla savunma — bu seni ele verir.",
      "Bekçi ve Şifacı Teyze'yi erkenden tespit edip etkisiz hale getir.",
    ],
    voteWeight: 1,
    nightActionDescription: "Çete odasında hedefini seç. Çoğunluk kararı bu geceyi belirler.",
    shortDesc: "Çetenin lideri, her gece hedef belirler.",
  },
  tahsildar: {
    id: "tahsildar",
    name: "Tahsildar",
    emoji: "🗡️",
    team: "kotu",
    description: "Çetenin sağ kolu. Çete oylamasına katılır; Davetsiz Misafir elenirse görevi devralır.",
    story: "Defteri elinde, kalemi kulağında. Davetsiz Misafir'in gözü kulağı sensin. Lider düşerse koltuğu sen doldurursun.",
    ability:
      "Çete gece oylamasına katılırsın. Davetsiz Misafir elenirse tek başına hedef belirleme yetkisi sana geçer. Birden fazla Tahsildar varsa kendi aralarında çoğunlukla karar alırlar.",
    winCondition: "Çete kazanırsa sen de kazanırsın.",
    tips: [
      "Sessiz kal ve dikkat çekme; güvenilir biri gibi görün.",
      "İyi rolden olduğunu iddia et — Bekçi seni çete olarak görebilir.",
      "Ekip arkadaşlarını dolaylı yoldan koru; doğrudan savunma şüphe çeker.",
    ],
    voteWeight: 1,
    nightActionDescription: "Çete odasında oy kullan. Davetsiz Misafir düşerse sen liderliği devralırsın.",
    shortDesc: "Çete oylamasına katılır, lider düşerse devralır.",
  },
  sahte_dernek: {
    id: "sahte_dernek",
    name: "Politikacı",
    emoji: "😇",
    team: "kotu",
    description: "Hayırsever görünür, çeteye hizmet eder. Linç edilirse çete anında kazanır.",
    story:
      "Cüzdanında dernek mührü, kalbinde çete sadakati. Mahalle onu güvenilir biri sanır — ama oy verip onu linç ettikleri an her şey biter.",
    ability:
      "Çete gece oylamasına katılırsın. Eğer gündüz oylamasıyla linç edilirsen oyun o anda biter ve çete kazanır. Gece öldürülmen bu etkiyi tetiklemez; yalnızca linç sonu geçerlidir.",
    winCondition: "Linç edilmediğin sürece çeteyle birlikte kazanırsın.",
    tips: [
      "Saygın ve zararsız bir oyuncu izlenimi ver — Muhtar veya Şifacı Teyze rolünü oyna.",
      "Asla suçlama odağına girme; dikkat çekersen mahalle seni linç eder.",
      "Tehlikeli bir anda başka bir şüpheliyi öne sürerek odağı kaydır.",
    ],
    voteWeight: 1,
    nightActionDescription: "Çete odasında oy kullan. Ama asıl görevin hayatta kalmak — linç edilirsen çete kaybeder.",
    shortDesc: "Linç edilirse çete ANINDA kazanır — tehlikeli!",
  },
  icten_pazarlikli: {
    id: "icten_pazarlikli",
    name: "İçten Pazarlıklı",
    emoji: "🐍",
    team: "kotu",
    description: "Bekçi sorgularsa 'Mahalle' sonucu alır. Her gece bir oyuncunun rolünü çeteye sızdırır.",
    story: "Komşu gibi görünür, gülümser. Ama her gece çeteye bilgi akıtır. Bekçinin feneri ona düştüğünde bile temiz çıkar.",
    ability:
      "Bekçi tarafından sorgulandığında 'Mahalle' sonucu döner — bu, oyundaki tek yanıltıcı roldür. Her gece sunucu rastgele bir oyuncunun rolünü çetenin özel bilgi kanalına iletir.",
    winCondition: "Çete kazanırsa sen de kazanırsın.",
    tips: [
      "Bekçi seni temiz görür; bunu güven kazanmak için kullan.",
      "Mahalle gibi davran, aktif oy ver, tartışmalara katıl.",
      "Çete seni tanır ama sen onları tanıyormuş gibi davranma.",
    ],
    voteWeight: 1,
    nightActionDescription: "Bu gece yapacak bir eylemin yok. Sistem otomatik olarak bir kişinin bilgisini çeteye sızdırıyor.",
    shortDesc: "Bekçiye iyi görünür, çeteye her gece bilgi sızdırır.",
  },

  // ── KARGAŞACILAR ──────────────────────────────────────────────────────────
  kumarbaz: {
    id: "kumarbaz",
    name: "Kumarbaz",
    emoji: "🎰",
    team: "kaos",
    description: "Her gece iki oyuncunun rolünü kalıcı olarak takas eder. Kimsenin rolü güvende değil.",
    story: "Kumarbaz zarı attı mı herkes başkası olabilir. Bu gece Bekçi olan biri, sabah çete üyesi olarak uyanabilir.",
    ability:
      "Her gece iki oyuncu seçersin; bu iki kişinin rolleri kalıcı olarak yer değiştirir. Takas başarılı olduğunda adlarını içeren özel bir mesaj alırsın. Son 3 oyuncu arasında hayatta kalmayı başarırsan anında kazanırsın.",
    winCondition:
      "Hayatta kalan son 3 oyuncudan biri olmak. Herkese karşı bağımsız kazanır.",
    tips: [
      "Kim olduğunu asla açıklama; kaos senin koruyucun.",
      "Kritik rolleri takas ederek mahallenin bilgi avantajını çökert.",
      "Son 3'e kadar hayatta kalmak yeterli — her turda varol.",
    ],
    voteWeight: 1,
    nightActionDescription: "İki kişi seç — bu iki kişinin rolleri kalıcı olarak yer değiştirir.",
    shortDesc: "İki kişinin rolünü kalıcı takas eder — kim ne oldu bilinmez.",
  },
  kiskanc_komsu: {
    id: "kiskanc_komsu",
    name: "Kıskanç Komşu",
    emoji: "🧂",
    team: "kaos",
    description: "Her gece bir kişinin gece eylemini kopyalar. Sonucu kendisine bildirilmez.",
    story: "Komşusunda ne varsa onu ister, ne yapıyorsa onu yapar — farkında bile olmadan. Bu gece kimi seçerse o kişinin gizlice izinden gider.",
    ability:
      "Her gece bir oyuncu seçersin; o kişi bu gece ne yapıyorsa sen de aynısını yapmış sayılırsın (kopya). Kopyaladığın eylemin sonucu sana bildirilmez. Çetenin öldürme eylemi kopyalanamaz.",
    winCondition:
      "Oyun boyunca hayatta kalmak. Kopyaladığı kişinin kazanan takımıyla birlikte sayılır.",
    tips: [
      "Güçlü gece rollerini (Bekçi, Falcı, Şifacı Teyze) kopyala.",
      "Kim olduğunu gizle; herhangi bir takıma yakın görün.",
      "Hayatta kalmak birincil öncelik — kaosun ortasında kaybolup git.",
    ],
    voteWeight: 1,
    nightActionDescription: "Bir kişiyi seç — o kişinin bu geceki eylemini kopyalarsın.",
    shortDesc: "Seçtiği kişinin gece eylemini kopyalar.",
  },
  kirik_kalp: {
    id: "kirik_kalp",
    name: "Kırık Kalp",
    emoji: "💔",
    team: "kaos",
    description: "Oyun başında rastgele bir kişiye bağlanır. O ölürse Kırık Kalp de hemen ölür.",
    story: "Kalbini birine bağladı. O giderse o da gider. Mahallede aşk, hiç bu kadar tehlikeli olmamıştı.",
    ability:
      "Oyun başında sunucu sana rastgele bir 'aşık' atar. Aşığın herhangi bir şekilde ölürse sen de aynı anda hayatını kaybedersin. Aşığın kim olduğunu yalnızca sen bilirsin; o ise sevildiğinden habersizdir.",
    winCondition:
      "Aşığınla birlikte ikisi de hayatta son iki oyuncu olarak kalırsa bağımsız olarak kazanırsınız.",
    tips: [
      "Aşığını herkesten önce koru — onun hayatta kalması senin hayatta kalmanla eşdeğer.",
      "Aşığının kim olduğunu kimseye söyleme; bilgi güçtür.",
      "Aşığın çete üyesi bile olsa onu koruman gerekir — moral değil, mecburiyet.",
    ],
    voteWeight: 1,
    nightActionDescription: "Bu gece yapacak bir eylemin yok. Aşığının güvende olduğunu umuyorsun.",
    shortDesc: "Aşığı ölürse o da ölür. İkisi hayatta kalırsa kazanır.",
  },
  dedikoducu: {
    id: "dedikoducu",
    name: "Dedikoducu",
    emoji: "🗣️",
    team: "kaos",
    description: "Ölümü bile bir silah. Öldüğü turdaki linç oylaması tersine döner.",
    story: "Her şeyi bilir, herkese anlatır. Ama asıl gücü ölümündedir — son sözü de o söyler.",
    ability:
      "Gece öldürülürsen bir sonraki gündüz linç oylamasının sonucu tersine döner; en az oy alan kişi elenmiş olur. Gündüz linç edilirsen o oylamanın kendisi tersine döner ve en az oyu alan kişi elenmiş sayılır (sen yine de elenir). Bu etki yalnızca bir kez geçerlidir.",
    winCondition:
      "Oyun boyunca en az 2 masum (mahalle takımından) oyuncu linç yoluyla elenmişse bağımsız kazanma koşulunu sağlar.",
    tips: [
      "Konuşmak sana şüphe çeker; ölme anını iyi zamanla.",
      "Ölümünden önce güçlü bir masum oyuncuyu linç hedefi olarak işaret et.",
      "Linç sırasında stratejik şekilde az oy topla — tersine dönünce sen değil, başkası gider.",
    ],
    voteWeight: 1,
    nightActionDescription: "Bu gece yapacak bir eylemin yok. Ama bu gece ölürsen, yarınki linç oylaması tersine dönecek.",
    shortDesc: "Ölünce bir sonraki linç oylaması tersine döner.",
  },

  // ── YALNIZ KURTLAR ────────────────────────────────────────────────────────
  anonim: {
    id: "anonim",
    name: "Anonim",
    emoji: "🎭",
    team: "tarafsiz",
    description: "Her gece bir kişiyi işaretler. İşaretlediği 3 kişi linç edilirse tek başına kazanır.",
    story: "Kimse tanımıyor, kimse bilmiyor. Ama o herkesi izliyor ve hesabını görüyor — gölgeden.",
    ability:
      "Her gece bir oyuncu işaretlersin. İşaretlediğin 3 kişi linç yoluyla elenmişse ve sen hâlâ hayattaysan oyun anında biter; yalnız ve herkese karşı kazanırsın. İşaretlenenler bu durumdan haberdar edilmez.",
    winCondition:
      "İşaretlediği 3 kişinin linç yoluyla elenmesi ve kendisinin hayatta kalması. Herkese karşı tek başına kazanır.",
    tips: [
      "Linç tartışmalarını yönlendir; en büyük şüpheliyi sen işaretle.",
      "Kimin işaretlendiğini asla açıklama — oyun stratejin sessizliğe dayanır.",
      "Kim olduğunu açıklarsan mahalle ve çete seni birlikte etkisiz kılar.",
    ],
    voteWeight: 1,
    nightActionDescription: "Bir kişiyi işaretle. 3 işaretlediğin kişi linç edilirse kazanırsın.",
    shortDesc: "İşaretlediği 3 kişi linç edilirse tek başına kazanır.",
  },
  kahraman_dede: {
    id: "kahraman_dede",
    name: "Kahraman Dede",
    emoji: "🪬",
    team: "tarafsiz",
    description: "Her gece bağımsız olarak bir kişiyi öldürür. İyi de, kötü de, kaos da — fark etmez.",
    story: "Yıllarca mahalleyi korudu. Artık kimseye güvenmiyor. Yargılamayı bıraktı, temizlemeye başladı. Tek başına.",
    ability:
      "Her gece çete oylamasından tamamen bağımsız olarak bir hedef seçer ve öldürürsün. Şifacı Teyze ve Hoca koruması saldırını engelleyebilir; ancak Kapıcı kilidi seni durduramaz. Hem çete hem mahalle oyuncularını hedef alabilirsin.",
    winCondition:
      "Mahalledeki tek hayatta kalan kişi olmak. Her takıma karşı bağımsız kazanır.",
    tips: [
      "İyi veya kötü — hepsini öldürebilirsin; seni sınırlayan yoktur.",
      "Son kalmak zorundasın; tehlikeli görünme, sessiz hareket et.",
      "Şifacı Teyze koruması saldırını püskürtebilir — kritik hedefleri tekrar dene.",
    ],
    voteWeight: 1,
    nightActionDescription: "Bu gece kimi mahalleden uzaklaştıracaksın?",
    shortDesc: "Her gece bağımsız öldürür. Tek kalırsa kazanır.",
  },
};

export const ROLE_TEAM_LABEL: Record<string, string> = {
  iyi: "MAHALLE",
  kotu: "ÇETE",
  kaos: "KARGAŞACILAR",
  tarafsiz: "YALNIZ KURT",
};

export const ROLE_TEAM_COLOR: Record<string, string> = {
  iyi: "#1ECBE1",
  kotu: "#FF4D6D",
  kaos: "#F5A623",
  tarafsiz: "#9B7FD4",
};
