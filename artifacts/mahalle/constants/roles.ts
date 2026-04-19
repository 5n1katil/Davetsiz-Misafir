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
}

export const ROLE_DEFS: Record<string, RoleDef> = {
  // ── MAHALLE TAKIMI ─────────────────────────────────────────────────────────
  muhtar: {
    id: "muhtar",
    name: "Muhtar",
    emoji: "🎖️",
    team: "iyi",
    description: "Mahallenin resmi sözcüsü. Oyumu 1.5 sayılır — bu herkes tarafından bilinir.",
    story: "Her sabah kahvede oturur, kararı o verir. Mührü cebinde, otoritesi sözünde.",
    ability: "Oylama gücün 1.5'tir. Bu durum herkes tarafından bilinir; çete seni birincil hedef alır.",
    winCondition: "Tüm çete ve tehlikeli kargaşacılar etkisiz hale getirilmeli.",
    tips: [
      "Erken kimliğini açıklama; çete hedefin olur.",
      "Oylamayı doğru zamanda kullan.",
      "Bekçi ve Falcı'ya güven.",
    ],
    voteWeight: 1.5,
  },
  bekci: {
    id: "bekci",
    name: "Bekçi",
    emoji: "🔦",
    team: "iyi",
    description: "Geceleri devriye gezer. Bir kişinin ekibini öğrenir (iyi/kötü).",
    story: "Düdüğü boynunda, feneri elinde. Her gece bir kapıyı çalar, içeri kim varsa ekibini anlar.",
    ability:
      "Her gece bir oyuncu seçersin. O kişinin 'Mahalle' mi yoksa 'Çete' mi olduğunu öğrenirsin. Kapı kilitliyse sonuç alınamaz.",
    winCondition: "Tüm çete elenirse kazanırsın.",
    tips: [
      "Bilgini çete ölmeden açıklama.",
      "Şüpheli iki kişiden birini sorgula.",
      "İçten Pazarlıklı seni 'Mahalle' olarak yanıltır.",
    ],
    voteWeight: 1,
  },
  otaci: {
    id: "otaci",
    name: "Şifacı Teyze",
    emoji: "🌿",
    team: "iyi",
    description: "Bitki şifacısı. Geceleri bir kişiyi saldırıdan korur.",
    story: "Çantasında ada çayı, kekik, biberiye. Hangi kapıyı çalsa o kişi sabah sapasağlam uyanır.",
    ability:
      "Her gece bir oyuncuyu korursun. Aynı kişiyi üst üste iki gece koruyamazsın. Oyun başına kendini bir kez koruyabilirsin.",
    winCondition: "Tüm çete elenirse kazanırsın.",
    tips: [
      "Aktif konuşan iyi oyuncuları koru; çete onları hedef alır.",
      "Aynı kişiyi üst üste koruma.",
      "Kendini de koruyabilirsin ama dikkatli kullan.",
    ],
    voteWeight: 1,
  },
  falci: {
    id: "falci",
    name: "Falcı",
    emoji: "🔮",
    team: "iyi",
    description: "Fincan açar, kader okur. Tam rol adını görür — ama %20 ihtimalle yanıltıcı sonuç.",
    story: "Türk kahvesi içsin, fincanı çevir. Falda ne çıkarsa o kişinin gerçeğidir... çoğunlukla.",
    ability:
      "Her gece bir oyuncu seçersin. Sabah onun tam rolünü öğrenirsin. %20 ihtimalle yanlış sonuç gelir; bu sana bildirilmez.",
    winCondition: "Tüm çete elenirse kazanırsın.",
    tips: [
      "Önce sessiz/şüpheli oyuncuları sorgula.",
      "Bilgini ipucu olarak paylaş, kesin kanıt olarak değil.",
      "Doğrulamak için aynı kişiyi iki gece sorgulayabilirsin.",
    ],
    voteWeight: 1,
  },
  kapici: {
    id: "kapici",
    name: "Kapıcı",
    emoji: "🧹",
    team: "iyi",
    description: "Her gece bir evi kilitler. Kilitlenen eve kimse giremez.",
    story: "Her anahtarın bir sırrı var. Bu gece hangi kapıyı kapatırsan o kapı korunur — içeriden de dışarıdan da.",
    ability:
      "Her gece bir oyuncunun evini kilitlersin. Kilitlenen eve çete saldıramaz, Bekçi sorgulayamaz, Şifacı Teyze koruyamaz, Falcı bakamaz. Kendi evini kilitleyemezsin.",
    winCondition: "Tüm çete elenirse kazanırsın.",
    tips: [
      "Kimi koruyacağını tahmin et.",
      "Şifacı Teyze ile koordineli çalış.",
      "Kendi evini kilitleme, işe yaramaz.",
    ],
    voteWeight: 1,
  },
  muhabir: {
    id: "muhabir",
    name: "Muhabir",
    emoji: "📰",
    team: "iyi",
    description: "Her şeyi not alır. Öldüğünde tüm notları herkese açıklanır.",
    story: "Her şeyi not alır, kimseye söylemez. Ama ölürse dosyalar açılır.",
    ability:
      "Özel gece yetkisi yok. Öldüğünde o ana kadar biriktirdiği tüm bilgiler tüm oyunculara otomatik açıklanır.",
    winCondition: "Tüm çete elenirse kazanırsın.",
    tips: [
      "Bilgiyi biriktir, erken açıklama.",
      "Çete seni susturmak ister — dikkatli ol.",
      "Ölmeden önce güvendiğin birine ipucu ver.",
    ],
    voteWeight: 1,
  },
  tiyatrocu: {
    id: "tiyatrocu",
    name: "Şehir Tiyatrocusu",
    emoji: "🎭",
    team: "iyi",
    description: "Öldüğünde gerçek rolü değil, sahte bir rol gösterilir.",
    story: "Hayat bir sahnedir. Ve o en iyi oyuncudur. Ölümü bile bir performanstır.",
    ability:
      "Oyun başında rastgele bir 'sahte rol' atanır. Öldüğünde (gece veya linç) herkese sahte rol gösterilir. Gerçek rolünü yalnızca host görür.",
    winCondition: "Tüm çete elenirse kazanırsın.",
    tips: [
      "Sahte rolünü stratejik kullan.",
      "Çeteyi yanlış yönlendir.",
      "Gerçek rolünü asla açıklama.",
    ],
    voteWeight: 1,
  },
  hoca: {
    id: "hoca",
    name: "Hoca",
    emoji: "📿",
    team: "iyi",
    description: "Tek kullanımlık güçlü koruma. Kapıcı kilidini bile aşar.",
    story: "Bir duası vardır. Bir kez eder. Kime ettiği her şeyi değiştirir.",
    ability:
      "Oyun boyunca yalnızca bir kez, bir oyuncuyu korursun. Bu koruma Kapıcı kilidini bile aşar. Kullandıktan sonra sıradan bir mahalle sakinine dönüşürsün.",
    winCondition: "Tüm çete elenirse kazanırsın.",
    tips: [
      "Tek kullanımlık — acele etme.",
      "Bekçi veya Falcı'yı koru.",
      "Yanlış kişiye kullanırsan çeteyi korumuş olursun.",
    ],
    voteWeight: 1,
  },
  koylu: {
    id: "koylu",
    name: "Mahalle Sakini",
    emoji: "🏘️",
    team: "iyi",
    description: "Sıradan bir mahalle sakini. Özel yeteneği yoktur; gündüz oylaması tek silahıdır.",
    story: "Sabah simit alır, akşam balkon muhabbeti. Dedikodu çoğu zaman gerçeği taşır.",
    ability: "Özel gece yetkisi yok. Gündüz oylamada söz hakkın var.",
    winCondition: "Tüm çete elenirse mahalle kazanır.",
    tips: [
      "Konuş, dinle, soru sor.",
      "Suskun oyuncular dikkat çeker; kararsız kalma.",
      "Bekçi ve Falcı'yı destekle.",
    ],
    voteWeight: 1,
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
      "Her gece ekibiyle birlikte bir hedef seçersin. Çoğunluk kararı geçer; o kişi sabah kaybolur.",
    winCondition:
      "Davetsiz Misafirler sayıca mahallelilere eşitlenirse veya geçerse mahalle ele geçirilir.",
    tips: [
      "Sakin ol; çok konuşan değil, doğru anda konuşan kazanır.",
      "Ekip arkadaşını fazla savunma — bu seni ele verir.",
      "Bekçi ve Şifacı Teyze'yi önce temizle.",
    ],
    voteWeight: 1,
  },
  tahsildar: {
    id: "tahsildar",
    name: "Tahsildar",
    emoji: "🗡️",
    team: "kotu",
    description: "Çetenin sağ kolu. Gece oylamasına katılır; lider düşerse görevi devralır.",
    story: "Defteri elinde, kalemi kulağında. Davetsiz Misafir'in gözü kulağı sensin.",
    ability:
      "Çete oylamasında oyu vardır. Davetsiz Misafir elenirse tek başına karar alırsın. Birden fazla Tahsildar varsa kendi aralarında oylama yapar.",
    winCondition: "Çete kazanırsa sen de kazanırsın.",
    tips: [
      "Sessiz kal, dikkat çekme.",
      "İyi rolden olduğunu iddia et.",
      "Çete arkadaşını uzaktan koru.",
    ],
    voteWeight: 1,
  },
  sahte_dernek: {
    id: "sahte_dernek",
    name: "Politikacı",
    emoji: "😇",
    team: "kotu",
    description: "Hayır işleri yapıyor görünür. Linç edilirse çete ANINDA kazanır!",
    story:
      "Cüzdanında dernek mührü, kalbinde çete kazancı. Linç edilirsen oyun anında biter — çete kazanır!",
    ability:
      "Çete oylamasına katılırsın. Eğer linç edilirsen oyun o an biter — çete kazanır! (Gece öldürülmesi bu etkiyi tetiklemez.)",
    winCondition: "Linç edilmemen yeterli; çete kazanırsa sen kazanırsın.",
    tips: [
      "Saygın bir rol gibi davran (Muhtar, Şifacı Teyze).",
      "Asla suçlama altında kalma.",
      "Riskli durumda başkasını öne sür.",
    ],
    voteWeight: 1,
  },
  icten_pazarlikli: {
    id: "icten_pazarlikli",
    name: "İçten Pazarlıklı",
    emoji: "🐍",
    team: "kotu",
    description: "Bekçi onu 'Mahalle' görür. Her gece çeteye bir kişinin rolünü sızdırır.",
    story: "Komşu gibi görünür. Gülümser. Ama her gece çeteye bilgi sızdırır.",
    ability:
      "Bekçi sorguladığında 'Mahalle' sonucu döner — tek aldatıcı rol budur. Her gece sunucu rastgele bir oyuncunun rolünü çetenin özel kanalına iletir.",
    winCondition: "Çete kazanırsa sen de kazanırsın.",
    tips: [
      "Bekçi seni temiz görür, bunu kullan.",
      "Mahalle gibi davran, oy ver, tartış.",
      "Çete seni bilir ama sen onları tanıyormuş gibi davranma.",
    ],
    voteWeight: 1,
  },

  // ── KARGAŞACILAR ──────────────────────────────────────────────────────────
  kumarbaz: {
    id: "kumarbaz",
    name: "Kumarbaz",
    emoji: "🎰",
    team: "kaos",
    description: "İki oyuncunun rolünü kalıcı olarak takas eder. Kimsenin rolü güvende değil.",
    story: "Kimsenin rolü güvende değil. Kumarbaz zarı attı mı herkes başkası olabilir.",
    ability:
      "Her gece iki oyuncu seçer, rolleri kalıcı olarak yer değiştirir. Kumarbaz kimleri takas ettiğini bilmez. Son 3 oyuncudan biri olursa kazanır.",
    winCondition: "Oyun bittiğinde hayatta kalan son 3 oyuncudan biri olmak.",
    tips: [
      "Kim olduğunu asla söyleme.",
      "Kaos yarat, hayatta kal.",
      "Son 3'e girersen kazanırsın.",
    ],
    voteWeight: 1,
  },
  kiskanc_komsu: {
    id: "kiskanc_komsu",
    name: "Kıskanç Komşu",
    emoji: "🧂",
    team: "kaos",
    description: "Her gece bir kişinin gece eylemini kopyalar. Sonucu bilmeden...",
    story: "Komşusunda ne varsa onu ister. Ne yapıyorsa onu yapar. Farkında bile olmadan.",
    ability:
      "Her gece bir oyuncu seçer ve o kişinin gece eylemini kopyalar. Kopyaladığı eylem veya sonucu kendisine bildirilmez. Çete öldürme eylemi kopyalanamaz.",
    winCondition: "Seçtiği ('aşık') kişiyle birlikte oyun sonuna kadar ikisi de hayatta kalırsa kazanır.",
    tips: [
      "Güçlü rolleri kopyala.",
      "Aşık olduğun kişiyi her şeyden önce koru.",
      "Kim olduğunu gizle.",
    ],
    voteWeight: 1,
  },
  kirik_kalp: {
    id: "kirik_kalp",
    name: "Kırık Kalp",
    emoji: "💔",
    team: "kaos",
    description: "Oyun başında rastgele bir kişiye bağlanır. O ölürse Kırık Kalp de ölür.",
    story: "Kalbini birine bağladı. O giderse o da gider. Aşk bu mahallede tehlikeli bir şey.",
    ability:
      "Oyun başında sunucu rastgele bir 'aşık' belirler. Aşık herhangi bir şekilde ölürse Kırık Kalp de aynı anda ölür. Aşık, sevildiğini bilmez.",
    winCondition: "Aşığıyla birlikte ikisi de oyun sonuna kadar hayatta kalırsa bağımsız olarak kazanır.",
    tips: [
      "Aşığını her şeyden önce koru.",
      "Aşığın kim olduğunu kimseye söyleme.",
      "Aşığın çeteden olsa bile onu koru.",
    ],
    voteWeight: 1,
  },
  dedikoducu: {
    id: "dedikoducu",
    name: "Dedikoducu",
    emoji: "🗣️",
    team: "kaos",
    description: "Öldüğü turdaki linç oylaması tersine döner — en az oy alan elenir.",
    story: "Her şeyi bilir, herkese anlatır. Ölümü bile bir dedikodudur.",
    ability:
      "Gece öldürülürse sonraki gündüz linç tersine döner. Gündüz linç edilirse o oylama tersine döner (Dedikoducu yine de elenir). En az oyu alan kişi elenmiş olur.",
    winCondition:
      "Oyun boyunca en az 2 masum oyuncu linç edilirse bağımsız kazanma puanı alır.",
    tips: [
      "Ne kadar çok konuşursan o kadar şüphe çekersin.",
      "Ölümün bile bir silah — zamanla.",
      "Yanlış yönlendir, izle.",
    ],
    voteWeight: 1,
  },

  // ── YALNIZ KURTLAR ────────────────────────────────────────────────────────
  anonim: {
    id: "anonim",
    name: "Anonim",
    emoji: "🎭",
    team: "tarafsiz",
    description: "Her gece bir kişiyi işaretler. İşaretlediği 3 kişi linç edilirse tek başına kazanır.",
    story: "Kimse tanımıyor. Kimse bilmiyor. Ama o herkesi izliyor ve hesabını görüyor.",
    ability:
      "Her gece bir oyuncu işaretlersin. İşaretlediğin 3 kişi linç yoluyla öldürülürse (hayatta olman gerekir) anında ve tek başına kazanırsın. İşaretlenenler bilgilendirilmez.",
    winCondition: "İşaretlediği 3 kişi linç edilmeli, Anonim hayatta olmalı. Herkese karşı tek kazanır.",
    tips: [
      "Linç tartışmalarını yönlendir.",
      "İşaretlediklerini hedef olarak göster.",
      "Kim olduğunu asla açıklama.",
    ],
    voteWeight: 1,
  },
  kahraman_dede: {
    id: "kahraman_dede",
    name: "Kahraman Dede",
    emoji: "🪬",
    team: "tarafsiz",
    description: "Her gece bağımsız olarak bir kişiyi öldürür. Hedefi kimin olduğu önemli değil.",
    story: "Yıllarca mahalleyi korudu. Artık kimseye güvenmiyor. Tek başına temizleyecek.",
    ability:
      "Her gece bağımsız bir öldürme eylemi gerçekleştirir — çete oylamasından ayrı. Şifacı Teyze ve Hoca koruması tarafından engellenir; Kapıcı kilidi tarafından engellenmez. Hem çete hem mahalle üyelerini öldürebilir.",
    winCondition: "Hayatta kalan tek kişi olmak. İyi, kötü, kaos — herkese karşı.",
    tips: [
      "Hem çeteyi hem mahalleyi öldürebilirsin.",
      "Son kalmak zorundasın.",
      "Şifacı Teyze bile seni koruyabilir.",
    ],
    voteWeight: 1,
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
