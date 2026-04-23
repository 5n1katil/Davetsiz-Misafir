export type Team = "iyi" | "kotu" | "kaos" | "tarafsiz";

export type NightActionType =
  | "cete_oylama"        // evil team kill vote
  | "koruma"             // Şifacı Teyze protect
  | "koruma_guclu"       // Hoca strong protect (overrides Kapıcı lock)
  | "sorgu_ekip"         // Bekçi team query
  | "sorgu_rol"          // Falcı role query
  | "kilit"              // Kapıcı house lock
  | "swap"               // Kumarbaz permanent role swap (two targets)
  | "kopya_hedef"        // Kıskanç Komşu select copy target
  | "isaretle"           // Anonim mark player
  | "bagimsiz_oldurme"   // Kahraman Dede independent kill
  | null;

export interface RoleDef {
  id: string;
  name: string;
  emoji: string;
  team: Team;
  isMafia: boolean;
  description: string;
  story: string;
  ability: string;
  winCondition: string;
  tips: string[];
  nightAction: NightActionType;
  nightOrder: number; // lower = earlier; 99 = no action
  voiceCallTr: string;
  voteWeight: number;
  isOneTimeUse?: boolean; // Hoca
}

export const ROLES: Record<string, RoleDef> = {
  // ── MAHALLE TAKIMI ──────────────────────────────────────────────────────────

  muhtar: {
    id: "muhtar",
    name: "Muhtar",
    emoji: "🎖️",
    team: "iyi",
    isMafia: false,
    description: "Mahallenin resmi sözcüsü. Oyu 1.5 sayılır — bu herkes tarafından bilinir.",
    story: "Her sabah kahvede oturur, kararı o verir. Mührü cebinde, otoritesi sözünde.",
    ability: "Oylama gücün 1.5'tir. Bu durum herkes tarafından bilinir; çete seni birincil hedef alır.",
    winCondition: "Tüm çete ve tehlikeli kargaşacılar etkisiz hale getirilmeli.",
    tips: ["Erken kimliğini açıklama; çete hedefin olur.", "Oylamayı doğru zamanda kullan.", "Bekçi ve Falcı'ya güven."],
    nightAction: null,
    nightOrder: 99,
    voiceCallTr: "",
    voteWeight: 1.5,
  },

  bekci: {
    id: "bekci",
    name: "Bekçi",
    emoji: "🔦",
    team: "iyi",
    isMafia: false,
    description: "Geceleri devriye gezer. Sorguladığı kişinin ekibini öğrenir.",
    story: "Düdüğü boynunda, feneri elinde. Her gece bir kapıyı çalar, içeri kim varsa ekibini anlar.",
    ability: "Her gece bir oyuncu seçersin. O kişinin ekibini öğrenirsin (kapı kilitliyse sonuç yok). İçten Pazarlıklı seni aldatır.",
    winCondition: "Tüm çete elenirse kazanırsın.",
    tips: ["Bilgini erken açıklama.", "Şüpheli iki kişiden birini sorgula.", "İçten Pazarlıklı'ya dikkat."],
    nightAction: "sorgu_ekip",
    nightOrder: 6,
    voiceCallTr: "Bekçi... fenerini yak. Bu gece hangi evi kontrol edeceksin?",
    voteWeight: 1,
  },

  otaci: {
    id: "otaci",
    name: "Şifacı Teyze",
    emoji: "🌿",
    team: "iyi",
    isMafia: false,
    description: "Bitki şifacısı. Geceleri bir kişiyi saldırıdan korur.",
    story: "Çantasında ada çayı, kekik, biberiye. Hangi kapıyı çalsa o kişi sabah sapasağlam uyanır.",
    ability: "Her gece bir oyuncuyu korursun. Kapı kilitliyse giremezsin. Aynı kişiyi üst üste koruyamazsın.",
    winCondition: "Tüm çete elenirse kazanırsın.",
    tips: ["Aktif iyi oyuncuları koru.", "Aynı kişiyi üst üste koruma.", "Kendini de koruyabilirsin."],
    nightAction: "koruma",
    nightOrder: 5,
    voiceCallTr: "Şifacı Teyze... bitkisel çantanı al. Bu gece kimin kapısını çalacaksın?",
    voteWeight: 1,
  },

  falci: {
    id: "falci",
    name: "Falcı",
    emoji: "🔮",
    team: "iyi",
    isMafia: false,
    description: "Fincan açar, kader okur. Bir kişinin tam rolünü öğrenir (%20 yanlış olabilir).",
    story: "Türk kahvesi içsin, fincanı çevir. Falda ne çıkarsa o kişinin gerçeğidir... çoğunlukla.",
    ability: "Her gece bir oyuncunun tam rolünü öğrenirsin (kapı kilitliyse sonuç yok; %20 yanlış).",
    winCondition: "Tüm çete elenirse kazanırsın.",
    tips: ["Önce sessiz/şüpheli oyuncuları sorgula.", "Bilgini ipucu olarak paylaş.", "Doğrulamak için aynı kişiyi iki gece sorgula."],
    nightAction: "sorgu_rol",
    nightOrder: 7,
    voiceCallTr: "Falcı... fincanı çevir. Bu gece kimin kaderine bakacaksın?",
    voteWeight: 1,
  },

  kapici: {
    id: "kapici",
    name: "Kapıcı",
    emoji: "🧹",
    team: "iyi",
    isMafia: false,
    description: "Her gece bir evi kilitler. Kilitlenen eve kimse giremez.",
    story: "Her anahtarın bir sırrı var. Bu gece hangi kapıyı kapatırsan o kapı korunur — içeriden de dışarıdan da.",
    ability: "Her gece bir oyuncunun evini kilitlersin. Kilide girmeye çalışan tüm gece eylemleri (çete, Bekçi, Falcı, Şifacı) engellenir. Kendi evini kilitleyemezsin.",
    winCondition: "Tüm çete elenirse kazanırsın.",
    tips: ["Kimi koruyacağını tahmin et.", "Şifacı Teyze ile koordineli çalış.", "Kendi evini kilitleme, işe yaramaz."],
    nightAction: "kilit",
    nightOrder: 4,
    voiceCallTr: "Kapıcı... anahtarlarını al. Bu gece hangi kapıyı kilitleyeceksin?",
    voteWeight: 1,
  },

  muhabir: {
    id: "muhabir",
    name: "Muhabir",
    emoji: "📰",
    team: "iyi",
    isMafia: false,
    description: "Her şeyi not alır. Öldüğünde tüm notları herkese açıklanır.",
    story: "Her şeyi not alır, kimseye söylemez. Ama ölürse dosyalar açılır.",
    ability: "Özel gece yetkisi yok. Öldüğünde aldığı özel mesajlar (Bekçi, Falcı sonuçları gibi) tüm oyunculara açıklanır.",
    winCondition: "Tüm çete elenirse kazanırsın.",
    tips: ["Bilgiyi biriktir.", "Çete seni susturmak ister.", "Ölmeden önce güvendiğin birine ipucu ver."],
    nightAction: null,
    nightOrder: 99,
    voiceCallTr: "",
    voteWeight: 1,
  },

  tiyatrocu: {
    id: "tiyatrocu",
    name: "Şehir Tiyatrocusu",
    emoji: "🎭",
    team: "iyi",
    isMafia: false,
    description: "Öldüğünde gerçek rolü değil, sahte bir rol gösterilir.",
    story: "Hayat bir sahnedir. Ve o en iyi oyuncudur. Ölümü bile bir performanstır.",
    ability: "Oyun başında rastgele bir 'sahte rol' atanır. Öldüğünde herkese sahte rol gösterilir. Gerçek rolünü yalnızca host görür.",
    winCondition: "Tüm çete elenirse kazanırsın.",
    tips: ["Sahte rolünü stratejik kullan.", "Çeteyi yanlış yönlendir.", "Gerçek rolünü asla açıklama."],
    nightAction: null,
    nightOrder: 99,
    voiceCallTr: "",
    voteWeight: 1,
  },

  hoca: {
    id: "hoca",
    name: "Hoca",
    emoji: "📿",
    team: "iyi",
    isMafia: false,
    description: "Tek kullanımlık güçlü koruma. Kapıcı kilidini bile aşar.",
    story: "Bir duası vardır. Bir kez eder. Kime ettiği her şeyi değiştirir.",
    ability: "Oyun boyunca yalnızca bir kez birini korursun. Kapıcı kilidini aşar. Kullandıktan sonra eylemsiz kalırsın.",
    winCondition: "Tüm çete elenirse kazanırsın.",
    tips: ["Tek kullanımlık — acele etme.", "Bekçi veya Falcı'yı koru.", "Yanlış kişiye kullanırsan çeteyi korumuş olursun."],
    nightAction: "koruma_guclu",
    nightOrder: 8,
    voiceCallTr: "Hoca... duanı et. Bu gece kime bereket vereceksin?",
    voteWeight: 1,
    isOneTimeUse: true,
  },

  koylu: {
    id: "koylu",
    name: "Mahalle Sakini",
    emoji: "🏘️",
    team: "iyi",
    isMafia: false,
    description: "Sıradan mahalle sakini. Tek silahı sezgisi ve oyu.",
    story: "Sabah simit alır, akşam çay içer. Geceleri evden çıkmaz ama kulağı kirişte.",
    ability: "Özel gece yetkisi yok. Sadece gündüz oylamada söz hakkın var.",
    winCondition: "Tüm çete elenirse mahalle kazanır.",
    tips: ["Konuş, dinle, soru sor.", "Suskun oyuncular dikkat çeker.", "Bekçi/Falcı'yı destekle."],
    nightAction: null,
    nightOrder: 99,
    voiceCallTr: "",
    voteWeight: 1,
  },

  // ── DAVETSİZ MİSAFİR ÇETESİ ────────────────────────────────────────────────

  tefeci_basi: {
    id: "tefeci_basi",
    name: "Davetsiz Misafir",
    emoji: "🚪",
    team: "kotu",
    isMafia: true,
    description: "Kimse onu davet etmedi. Ama o burada. Ve her gece biri kayboluyor.",
    story: "Geçen ay taşındı. Kapıda kibarca güldü, elini sıktı. Ama o gülümseme hiç gözlerine yansımadı.",
    ability: "Her gece ekibiyle birlikte bir hedef seçer. Çoğunluk kimi seçtiyse o kişi sabah kaybolur.",
    winCondition: "Davetsiz Misafirler sayıca mahallelilere eşitlenince mahalle ele geçirilir.",
    tips: ["Sakin ol.", "Ekip arkadaşını fazla savunma.", "Bekçi ve Şifacı'yı önce temizle."],
    nightAction: "cete_oylama",
    nightOrder: 3,
    voiceCallTr: "Davetsiz Misafir uyanıyor... Bu gece kimin kapısını çalacaksınız?",
    voteWeight: 1,
  },

  tahsildar: {
    id: "tahsildar",
    name: "Tahsildar",
    emoji: "🗡️",
    team: "kotu",
    isMafia: true,
    description: "Çetenin sağ kolu. Çete oylamasında oyu vardır.",
    story: "Defteri elinde, kalemi kulağında. Davetsiz Misafir'in gözü kulağı sensin.",
    ability: "Çete oylamasında bir oyu vardır. Davetsiz Misafir düşerse çete oylamasını yönetirsin.",
    winCondition: "Çete kazanırsa sen de kazanırsın.",
    tips: ["Sessiz kal.", "İyi rolden olduğunu iddia et.", "Çete arkadaşını uzaktan koru."],
    nightAction: "cete_oylama",
    nightOrder: 3,
    voiceCallTr: "",
    voteWeight: 1,
  },

  sahte_dernek: {
    id: "sahte_dernek",
    name: "Politikacı",
    emoji: "😇",
    team: "kotu",
    isMafia: true,
    description: "Hayır işleri yapıyor görünür. Linç edilirse çete ANINDA kazanır!",
    story: "Cüzdanında dernek mührü, kalbinde çete kazancı. Linç edilirsen oyun anında biter.",
    ability: "Çete oylamasına katılır. Linç edilirsen oyun biter — çete kazanır! (Gece öldürülmesi tetiklemez.)",
    winCondition: "Çete kazanırsa veya sen linç edilirsen çete anında kazanır.",
    tips: ["Saygın bir rol gibi davran.", "Asla suçlama altında kalma.", "Riskli durumda başkasını öne sür."],
    nightAction: "cete_oylama",
    nightOrder: 3,
    voiceCallTr: "",
    voteWeight: 1,
  },

  icten_pazarlikli: {
    id: "icten_pazarlikli",
    name: "İçten Pazarlıklı",
    emoji: "🐍",
    team: "kotu",
    isMafia: true,
    description: "Bekçi onu 'Mahalle' görür. Her gece çeteye bir kişinin rolünü sızdırır.",
    story: "Komşu gibi görünür. Gülümser. Ama her gece çeteye bilgi sızdırır.",
    ability: "Bekçi sorguladığında 'Mahalle' sonucu döner. Her gece sunucu rastgele bir oyuncunun rolünü çetenin kanalına iletir.",
    winCondition: "Çete kazanırsa sen de kazanırsın.",
    tips: ["Bekçi seni temiz görür, bunu kullan.", "Mahalle gibi davran.", "Çete seni bilir ama sen onları tanıyormuş gibi davranma."],
    nightAction: null,
    nightOrder: 99,
    voiceCallTr: "",
    voteWeight: 1,
  },

  // ── KARGAŞACILAR ───────────────────────────────────────────────────────────

  kumarbaz: {
    id: "kumarbaz",
    name: "Kumarbaz",
    emoji: "🎰",
    team: "kaos",
    isMafia: false,
    description: "İki oyuncunun rolünü kalıcı olarak takas eder.",
    story: "Kimsenin rolü güvende değil. Kumarbaz zarı attı mı herkes başkası olabilir.",
    ability: "Her gece iki oyuncu seçer, rolleri kalıcı olarak yer değiştirir. Kumarbaz kimleri takas ettiğini bilmez. Son 3'e kalırsa kazanır.",
    winCondition: "Oyun bittiğinde hayatta kalan son 3 oyuncudan biri olmak.",
    tips: ["Kim olduğunu asla söyleme.", "Kaos yarat, hayatta kal.", "Son 3'e girersen kazanırsın."],
    nightAction: "swap",
    nightOrder: 1,
    voiceCallTr: "Kumarbaz... zarlarını at. Bu gece kimlerin kaderini takas edeceksin?",
    voteWeight: 1,
  },

  kiskanc_komsu: {
    id: "kiskanc_komsu",
    name: "Kıskanç Komşu",
    emoji: "🧂",
    team: "kaos",
    isMafia: false,
    description: "Her gece bir kişinin gece eylemini kopyalar.",
    story: "Komşusunda ne varsa onu ister. Ne yapıyorsa onu yapar. Farkında bile olmadan.",
    ability: "Her gece bir oyuncu seçer ve o kişinin gece eylemini kopyalar. Çete öldürme eylemi kopyalanamaz. Sonucu kendisine bildirilmez.",
    winCondition: "Seçtiği kişiyle birlikte ikisi de oyun sonuna kadar hayatta kalırsa kazanır.",
    tips: ["Güçlü rolleri kopyala.", "Aşık olduğun kişiyi koru.", "Kim olduğunu gizle."],
    nightAction: "kopya_hedef",
    nightOrder: 2,
    voiceCallTr: "Kıskanç Komşu... perdeyi aralamadan izle. Bu gece kimi taklit edeceksin?",
    voteWeight: 1,
  },

  kirik_kalp: {
    id: "kirik_kalp",
    name: "Kırık Kalp",
    emoji: "💔",
    team: "kaos",
    isMafia: false,
    description: "Oyun başında rastgele bir kişiye bağlanır. O ölürse Kırık Kalp de ölür.",
    story: "Kalbini birine bağladı. O giderse o da gider. Aşk bu mahallede tehlikeli bir şey.",
    ability: "Oyun başında rastgele bir 'aşık' belirlenir. Aşık ölünce Kırık Kalp de ölür. Aşık, sevildiğini bilmez.",
    winCondition: "Aşığıyla birlikte ikisi de oyun sonuna kadar hayatta kalırsa bağımsız kazanır.",
    tips: ["Aşığını her şeyden önce koru.", "Aşığın kim olduğunu kimseye söyleme.", "Aşığın çeteden olsa bile onu koru."],
    nightAction: null,
    nightOrder: 99,
    voiceCallTr: "",
    voteWeight: 1,
  },

  dedikoducu: {
    id: "dedikoducu",
    name: "Dedikoducu",
    emoji: "🗣️",
    team: "kaos",
    isMafia: false,
    description: "Öldüğü turdaki linç oylaması tersine döner.",
    story: "Her şeyi bilir, herkese anlatır. Ölümü bile bir dedikodudur.",
    ability: "Gece öldürülürse sonraki linç tersine döner. Gündüz linç edilirse o oylama tersine döner (Dedikoducu yine de elenir).",
    winCondition: "Oyun boyunca en az 2 masum oyuncu linç edilirse kişisel kazanma puanı alır.",
    tips: ["Ne kadar çok konuşursan o kadar şüphe çekersin.", "Ölümün bile bir silah.", "Yanlış yönlendir, izle."],
    nightAction: null,
    nightOrder: 99,
    voiceCallTr: "",
    voteWeight: 1,
  },

  // ── YALNIZ KURTLAR ─────────────────────────────────────────────────────────

  anonim: {
    id: "anonim",
    name: "Anonim",
    emoji: "🎭",
    team: "tarafsiz",
    isMafia: false,
    description: "Her gece bir kişiyi işaretler. 3 işaretli linç edilirse tek başına kazanır.",
    story: "Kimse tanımıyor. Kimse bilmiyor. Ama o herkesi izliyor ve hesabını görüyor.",
    ability: "Her gece bir oyuncuyu işaretlersin. İşaretlediğin 3 kişi linç edilirse (hayatta olman şartıyla) anında ve tek başına kazanırsın.",
    winCondition: "İşaretlediği 3 kişi linç edilmeli, Anonim hayatta olmalı. Herkese karşı tek kazanır.",
    tips: ["Linç tartışmalarını yönlendir.", "İşaretlediklerini hedef olarak göster.", "Kim olduğunu asla açıklama."],
    nightAction: "isaretle",
    nightOrder: 10,
    voiceCallTr: "Anonim... gölgede kal. Bu gece kimi işaretliyorsun?",
    voteWeight: 1,
  },

  kahraman_dede: {
    id: "kahraman_dede",
    name: "Kahraman Dede",
    emoji: "🪬",
    team: "tarafsiz",
    isMafia: false,
    description: "Her gece bağımsız olarak bir kişiyi öldürür.",
    story: "Yıllarca mahalleyi korudu. Artık kimseye güvenmiyor. Tek başına temizleyecek.",
    ability: "Her gece bağımsız bir öldürme eylemi. Şifacı/Hoca koruması engeller; Kapıcı kilidi engellemez. Hem çete hem mahalle öldürebilir.",
    winCondition: "Hayatta kalan tek kişi olmak. İyi, kötü, kaos — herkese karşı.",
    tips: ["Hem çeteyi hem mahalleyi öldürebilirsin.", "Son kalmak zorundasın.", "Şifacı Teyze bile seni koruyabilir."],
    nightAction: "bagimsiz_oldurme",
    nightOrder: 9,
    voiceCallTr: "Kahraman Dede... çıkma vakti. Bu gece kim mahallemi bozuyor?",
    voteWeight: 1,
  },
};

// ── ROL DAĞILIM TABLOSU ──────────────────────────────────────────────────────

interface Distribution {
  dm: number;         // Davetsiz Misafir sayısı
  tahsildar: number;  // Tahsildar sayısı
  politikaci: boolean; // Politikacı (sahte_dernek) var mı
  icten: boolean;     // İçten Pazarlıklı var mı
  kaosCount: number;  // Kargaşacı rol sayısı
  tarafsizCount: number; // Yalnız Kurt sayısı
  specialCount: number; // Özel Mahalle rolü sayısı (muhtar, bekci, otaci, falci, kapici, muhabir, tiyatrocu, hoca)
}

function getDistribution(playerCount: number): Distribution {
  if (playerCount <= 6) {
    return { dm: 1, tahsildar: 1, politikaci: false, icten: false, kaosCount: 0, tarafsizCount: 0, specialCount: 0 };
  } else if (playerCount <= 9) {
    return { dm: 1, tahsildar: 1, politikaci: true, icten: false, kaosCount: 0, tarafsizCount: 0, specialCount: 1 };
  } else if (playerCount <= 13) {
    return { dm: 2, tahsildar: 1, politikaci: true, icten: false, kaosCount: 0, tarafsizCount: 0, specialCount: 2 };
  } else if (playerCount <= 18) {
    return { dm: 3, tahsildar: 2, politikaci: true, icten: true, kaosCount: 0, tarafsizCount: 0, specialCount: 3 };
  } else if (playerCount <= 24) {
    return { dm: 4, tahsildar: 2, politikaci: true, icten: true, kaosCount: 1, tarafsizCount: 0, specialCount: 4 };
  } else {
    return { dm: 5, tahsildar: 3, politikaci: true, icten: true, kaosCount: 2, tarafsizCount: 2, specialCount: 5 };
  }
}

export interface RolePoolOptions {
  rolePackage?: "standard" | "advanced" | "all";
  disabledRoles?: string[];
}

const SPECIAL_BY_PACKAGE: Record<string, string[]> = {
  standard: ["bekci", "otaci", "kapici"],
  advanced: ["bekci", "otaci", "kapici", "falci", "muhtar", "muhabir", "hoca"],
  all:      ["bekci", "otaci", "kapici", "falci", "muhtar", "muhabir", "hoca", "tiyatrocu"],
};

const KAOS_BY_PACKAGE: Record<string, string[]> = {
  standard: [],
  advanced: ["kirik_kalp", "dedikoducu"],
  all:      ["kumarbaz", "kiskanc_komsu", "kirik_kalp", "dedikoducu"],
};

const TARAFSIZ_BY_PACKAGE: Record<string, string[]> = {
  standard: [],
  advanced: [],
  all:      ["anonim", "kahraman_dede"],
};

export function buildRolePool(
  playerCount: number,
  options: RolePoolOptions = {},
): string[] {
  const pkg = options.rolePackage ?? "all";
  const disabled = new Set(options.disabledRoles ?? []);
  const dist = getDistribution(playerCount);
  const pool: string[] = [];

  // Çete (zorunlu rollerden biri devre dışıysa tahsildar koyarız)
  for (let i = 0; i < dist.dm; i++) pool.push("tefeci_basi");
  for (let i = 0; i < dist.tahsildar; i++) pool.push("tahsildar");
  if (dist.politikaci && !disabled.has("sahte_dernek")) pool.push("sahte_dernek");
  if (dist.icten && !disabled.has("icten_pazarlikli")) pool.push("icten_pazarlikli");

  // Özel Mahalle rolleri (pakete + disabledRoles göre filtreli)
  const specialPool = [...(SPECIAL_BY_PACKAGE[pkg] ?? SPECIAL_BY_PACKAGE.all)].filter(
    (r) => !disabled.has(r),
  );
  for (let i = 0; i < dist.specialCount && specialPool.length > 0; i++) {
    const idx = Math.floor(Math.random() * specialPool.length);
    pool.push(specialPool.splice(idx, 1)[0]);
  }

  // Kaos rolleri (pakete + disabledRoles göre filtreli)
  const kaosPool = [...(KAOS_BY_PACKAGE[pkg] ?? [])].filter((r) => !disabled.has(r));
  for (let i = 0; i < dist.kaosCount && kaosPool.length > 0; i++) {
    const idx = Math.floor(Math.random() * kaosPool.length);
    pool.push(kaosPool.splice(idx, 1)[0]);
  }

  // Yalnız Kurt rolleri (pakete + disabledRoles göre filtreli)
  const tarafsizPool = [...(TARAFSIZ_BY_PACKAGE[pkg] ?? [])].filter((r) => !disabled.has(r));
  for (let i = 0; i < dist.tarafsizCount && tarafsizPool.length > 0; i++) {
    const idx = Math.floor(Math.random() * tarafsizPool.length);
    pool.push(tarafsizPool.splice(idx, 1)[0]);
  }

  // Kalan slotları köylü ile doldur
  while (pool.length < playerCount) pool.push("koylu");

  // Pool oyuncu sayısından büyükse güvence truncation
  while (pool.length > playerCount) pool.pop();

  return pool;
}
