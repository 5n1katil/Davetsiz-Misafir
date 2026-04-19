export type Team = "iyi" | "kotu";
export type NightActionType =
  | "cete_oylama"
  | "koruma"
  | "sorgu_ekip"
  | "sorgu_rol"
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
  nightOrder: number;
  voiceCallTr: string;
  voteWeight: number;
}

export const ROLES: Record<string, RoleDef> = {
  tefeci_basi: {
    id: "tefeci_basi",
    name: "Davetsiz Misafir",
    emoji: "🚪",
    team: "kotu",
    isMafia: true,
    description: "Kimse onu davet etmedi. Ama o burada. Ve her gece biri kayboluyor.",
    story:
      "Geçen ay taşındı. Kapıda kibarca güldü, elini sıktı. Ama o gülümseme hiç gözlerine yansımadı. Elindeki anahtar — binada o numaralı daire yok.",
    ability:
      "Her gece ekibiyle birlikte bir hedef seçer. Çoğunluk kimi seçtiyse o kişi sabah kaybolur.",
    winCondition:
      "Davetsiz misafirler sayıca mahallelilere eşitlenirse veya geçerse, mahalle ele geçirilir.",
    tips: [
      "Sakin ol; çok konuşan değil, doğru anda konuşan kazanır.",
      "Ekip arkadaşını fazla savunma — bu seni ele verir.",
      "Masum birine şüphe yönlendir; oylamayı sen yönet.",
    ],
    nightAction: "cete_oylama",
    nightOrder: 3,
    voiceCallTr:
      "Davetsiz Misafir uyanıyor... Bu gece kimin kapısını çalacaksınız?",
    voteWeight: 1,
  },
  tahsildar: {
    id: "tahsildar",
    name: "Tahsildar",
    emoji: "🧾",
    team: "kotu",
    isMafia: true,
    description: "Çetenin sağ kolu. Çete oylamasında oyu vardır.",
    story:
      "Defteri elinde, kalemi kulağında. Davetsiz Misafir'in gözü kulağı sensin.",
    ability:
      "Çete oylamasında bir oyu vardır. Davetsiz Misafir düşerse çete oylamasını yönetirsin.",
    winCondition: "Çete kazanırsa sen de kazanırsın.",
    tips: [
      "Sessiz kal, dikkat çekme.",
      "İyi rolden olduğunu iddia et (örnek: Köylü).",
      "Çete arkadaşını çok savunma; uzaktan koru.",
    ],
    nightAction: "cete_oylama",
    nightOrder: 3,
    voiceCallTr: "",
    voteWeight: 1,
  },
  sahte_dernek: {
    id: "sahte_dernek",
    name: "Sahte Dernek Başkanı",
    emoji: "🎩",
    team: "kotu",
    isMafia: true,
    description:
      "Mahallenin saygın yüzü gibi görünür ama çetenin perde arkasıdır.",
    story:
      "Cüzdanında dernek mührü, kalbinde çete kazancı. Linç edilirsen çete kazanır.",
    ability:
      "Çete oylamasına katılır. Eğer linç edilirsen oyun anında biter — çete kazanır!",
    winCondition:
      "Çete kazanırsa veya sen linç edilirsen çete anında kazanır.",
    tips: [
      "Saygın bir rol gibi davran (Muhtar, Hoca).",
      "Asla suçlama altında kalma.",
      "Riskli durumda başkasını öne sür.",
    ],
    nightAction: "cete_oylama",
    nightOrder: 3,
    voiceCallTr: "",
    voteWeight: 1,
  },
  koylu: {
    id: "koylu",
    name: "Köylü",
    emoji: "👨‍🌾",
    team: "iyi",
    isMafia: false,
    description: "Sıradan mahalle sakini. Tek silahı sezgisi ve oyu.",
    story:
      "Sabah simit alır, akşam çay içer. Geceleri evden çıkmaz ama kulağı kirişte.",
    ability: "Özel gece yetkisi yok. Sadece gündüz oylamada söz hakkın var.",
    winCondition: "Tüm çete elenirse mahalle kazanır.",
    tips: [
      "Konuş, dinle, soru sor.",
      "Oylamada kararsız kalma; suskun oyuncular dikkat çeker.",
      "Bilgi paylaşımı yapan rolleri (Bekçi, Falcı) destekle.",
    ],
    nightAction: null,
    nightOrder: 99,
    voiceCallTr: "",
    voteWeight: 1,
  },
  muhtar: {
    id: "muhtar",
    name: "Muhtar",
    emoji: "🎖️",
    team: "iyi",
    isMafia: false,
    description: "Mahallenin resmi sözcüsü. Oyu 1.5 sayılır.",
    story:
      "Her sabah kahvede oturur, kararı o verir. Mührü cebinde, otoritesi sözünde.",
    ability: "Oylama gücün 1.5'tir. Diğer iyi roller seninle daha güçlü.",
    winCondition: "Tüm çete elenirse kazanırsın.",
    tips: [
      "Erken claim (rolünü açıkla) yapma; çete hedefin olur.",
      "Oyunu doğru zamanda kullan; oyunun gidişatını sen belirlersin.",
      "Bekçi/Falcı'ya inan; onları dinle.",
    ],
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
    story:
      "Düdüğü boynunda, feneri elinde. Her gece bir kapıyı çalar, içeri kim varsa ekibini anlar.",
    ability:
      "Her gece bir oyuncu seçersin. Sabah o kişinin 'iyi' mi 'kötü' mü olduğunu öğrenirsin.",
    winCondition: "Tüm çete elenirse kazanırsın.",
    tips: [
      "Bilgini çete ölmeden açıklama.",
      "Şüpheli iki kişiden birini sorgula.",
      "Sonucu Muhtar'a fısılda; o yönlendirsin.",
    ],
    nightAction: "sorgu_ekip",
    nightOrder: 6,
    voiceCallTr:
      "Bekçi... fenerini yak. Bu gece hangi evi kontrol edeceksin?",
    voteWeight: 1,
  },
  otaci: {
    id: "otaci",
    name: "Otacı Teyze",
    emoji: "🌿",
    team: "iyi",
    isMafia: false,
    description: "Bitki şifacısı. Geceleri bir kişiyi korur.",
    story:
      "Çantasında ada çayı, kekik, biberiye. Hangi kapıyı çalsa o kişi sabah sapasağlam uyanır.",
    ability:
      "Her gece bir oyuncu seçersin. O gece o kişiye yapılan saldırı engellenir.",
    winCondition: "Tüm çete elenirse kazanırsın.",
    tips: [
      "Kendini de koruyabilirsin ama dikkat et — riski oyuncuya kaydır.",
      "Aktif konuşan iyi oyuncuları koru; çete onları hedef alır.",
      "Aynı kişiyi üst üste koruma, tahmin edilirsin.",
    ],
    nightAction: "koruma",
    nightOrder: 5,
    voiceCallTr:
      "Otacı Teyze... bitkisel çantanı al. Bu gece kimin kapısını çalacaksın?",
    voteWeight: 1,
  },
  falci: {
    id: "falci",
    name: "Falcı",
    emoji: "🔮",
    team: "iyi",
    isMafia: false,
    description: "Fincan açar, kader okur. Bir kişinin tam rolünü öğrenir.",
    story:
      "Türk kahvesi içsin, fincanı çevir. Falda ne çıkarsa o kişinin gerçeğidir... çoğunlukla.",
    ability:
      "Her gece bir oyuncu seçersin. Sabah o kişinin tam rolünü öğrenirsin (yüzde 20 ihtimalle yanlış).",
    winCondition: "Tüm çete elenirse kazanırsın.",
    tips: [
      "Önce sessiz/şüpheli oyuncuları sorgula.",
      "İlk gece riskli — ölmeyecek bir hedef seç.",
      "Bilgini kanıt olarak değil, ipucu olarak paylaş.",
    ],
    nightAction: "sorgu_rol",
    nightOrder: 7,
    voiceCallTr:
      "Falcı... fincanı çevir. Bu gece kimin kaderine bakacaksın?",
    voteWeight: 1,
  },
};

export function buildRolePool(
  playerCount: number,
  ceteCount: number,
  activeSpecial: string[],
): string[] {
  const pool: string[] = [];

  // Çete kompozisyonu: her çete için 1 Tefeci Başı + 1 Tahsildar; ek olarak 1 Sahte Dernek (toplam üzerinde)
  for (let i = 0; i < ceteCount; i++) {
    pool.push("tefeci_basi");
    pool.push("tahsildar");
  }
  pool.push("sahte_dernek");

  // Aktif özel iyi roller
  for (const id of activeSpecial) {
    if (ROLES[id] && ROLES[id].team === "iyi") {
      pool.push(id);
    }
  }

  // Pool oyuncu sayısından büyükse çete dışını ya da special'ı kırp
  while (pool.length > playerCount) {
    // önce özel rolleri kırp (sondan)
    const lastSpecialIdx = [...pool].reverse().findIndex((r) => {
      const role = ROLES[r];
      return role && role.team === "iyi";
    });
    if (lastSpecialIdx === -1) {
      pool.pop();
    } else {
      pool.splice(pool.length - 1 - lastSpecialIdx, 1);
    }
  }

  // Kalan slotları köylü ile doldur
  while (pool.length < playerCount) {
    pool.push("koylu");
  }

  return pool;
}
