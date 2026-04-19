export interface RoleDef {
  id: string;
  name: string;
  emoji: string;
  team: "iyi" | "kotu";
  description: string;
  story: string;
  ability: string;
  winCondition: string;
  tips: string[];
  voteWeight: number;
}

export const ROLE_DEFS: Record<string, RoleDef> = {
  tefeci_basi: {
    id: "tefeci_basi",
    name: "Davetsiz Misafir",
    emoji: "🚪",
    team: "kotu",
    description: "Kimse onu davet etmedi. Ama o burada. Ve her gece biri kayboluyor.",
    story:
      "Geçen ay taşındı. Kapıda kibarca güldü, elini sıktı. Ama o gülümseme hiç gözlerine yansımadı. Elindeki anahtar — binada o numaralı daire yok.",
    ability:
      "Her gece ekibiyle birlikte bir hedef seçersin. Çoğunluk kararı geçer ve o kişi sabah kaybolur.",
    winCondition:
      "Davetsiz misafirler sayıca mahallelilere eşitlenirse veya geçerse, mahalle ele geçirilir.",
    tips: [
      "Sakin ol; çok konuşan değil, doğru anda konuşan kazanır.",
      "Ekip arkadaşını fazla savunma — bu seni ele verir.",
      "Masum birine şüphe yönlendir; oylamayı sen yönet.",
    ],
    voteWeight: 1,
  },
  tahsildar: {
    id: "tahsildar",
    name: "Tahsildar",
    emoji: "🧾",
    team: "kotu",
    description: "Çetenin sağ kolu. Çete oylamasında oyu vardır.",
    story: "Defteri elinde, kalemi kulağında. Davetsiz Misafir'in gözü kulağı sensin.",
    ability:
      "Çete oylamasında bir oyun var. Davetsiz Misafir düşerse oylamayı sen yönetirsin.",
    winCondition: "Çete kazanırsa sen de kazanırsın.",
    tips: [
      "Sessiz kal, dikkat çekme.",
      "İyi rolden olduğunu iddia et (ör. Dedikoducu).",
      "Çete arkadaşını uzaktan koru.",
    ],
    voteWeight: 1,
  },
  sahte_dernek: {
    id: "sahte_dernek",
    name: "Dernek Başkanı",
    emoji: "🎩",
    team: "kotu",
    description: "Saygın görünür ama çetenin perde arkasıdır.",
    story:
      "Cüzdanında dernek mührü, kalbinde çete kazancı. Linç edilirsen çete kazanır!",
    ability:
      "Çete oylamasına katılırsın. Eğer linç edilirsen oyun anında biter — çete kazanır!",
    winCondition: "Linç edilmemen yeterli; çete kazanırsa sen kazanırsın.",
    tips: [
      "Saygın bir rol gibi davran (Muhtar, Şifacı Teyze).",
      "Asla suçlama altında kalma.",
      "Riskli durumda başkasını öne sür.",
    ],
    voteWeight: 1,
  },
  koylu: {
    id: "koylu",
    name: "Dedikoducu",
    emoji: "💬",
    team: "iyi",
    description: "Mahallenin hafızası. Her şeyi duyar, her şeyi bilir — ama silahı yalnızca sözü.",
    story:
      "Sabah simit alır, akşam balkon muhabbeti. Kapı kapı dolaşır, kulağı kirişte. Dedikodu çoğu zaman gerçeği taşır.",
    ability: "Özel gece yetkisi yok. Gündüz oylamada söz hakkın var.",
    winCondition: "Tüm çete elenirse mahalle kazanır.",
    tips: [
      "Konuş, dinle, soru sor.",
      "Suskun oyuncular dikkat çeker; kararsız kalma.",
      "Bekçi/Falcı'yı destekle.",
    ],
    voteWeight: 1,
  },
  muhtar: {
    id: "muhtar",
    name: "Muhtar",
    emoji: "🎖️",
    team: "iyi",
    description: "Mahallenin resmi sözcüsü. Oyum 1.5 sayılır.",
    story: "Her sabah kahvede oturur, kararı o verir. Mührü cebinde, otoritesi sözünde.",
    ability: "Oylama gücün 1.5'tir. Diğer iyi roller seninle daha güçlü.",
    winCondition: "Tüm çete elenirse kazanırsın.",
    tips: [
      "Erken claim yapma; çete hedefin olur.",
      "Oyunu doğru zamanda kullan.",
      "Bekçi/Falcı'ya inan.",
    ],
    voteWeight: 1.5,
  },
  bekci: {
    id: "bekci",
    name: "Bekçi",
    emoji: "🔦",
    team: "iyi",
    description: "Geceleri devriye gezer. Ekip bilgisi öğrenir.",
    story:
      "Düdüğü boynunda, feneri elinde. Her gece bir kapıyı çalar, içeri kim varsa ekibini anlar.",
    ability:
      "Her gece bir oyuncu seçersin. Sabah onun 'iyi' mi 'kötü' mü olduğunu öğrenirsin.",
    winCondition: "Tüm çete elenirse kazanırsın.",
    tips: [
      "Bilgini çete ölmeden açıklama.",
      "Şüpheli iki kişiden birini sorgula.",
      "Sonucu Muhtar'a fısılda; o yönlendirsin.",
    ],
    voteWeight: 1,
  },
  otaci: {
    id: "otaci",
    name: "Şifacı Teyze",
    emoji: "🌿",
    team: "iyi",
    description: "Bitki şifacısı. Geceleri bir kişiyi korur.",
    story:
      "Çantasında ada çayı, kekik, biberiye. Hangi kapıyı çalsa o kişi sabah sapasağlam uyanır.",
    ability:
      "Her gece bir oyuncu seçersin. O gece o kişiye yapılan saldırı engellenir.",
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
    description: "Fincan açar, kader okur. Tam rol görür.",
    story:
      "Türk kahvesi içsin, fincanı çevir. Falda ne çıkarsa o kişinin gerçeğidir... çoğunlukla.",
    ability:
      "Her gece bir oyuncu seçersin. Sabah onun tam rolünü öğrenirsin (yüzde 20 yanlış).",
    winCondition: "Tüm çete elenirse kazanırsın.",
    tips: [
      "Önce sessiz/şüpheli oyuncuları sorgula.",
      "İlk gece riskli — ölmeyecek bir hedef seç.",
      "Bilgini ipucu olarak paylaş, kanıt olarak değil.",
    ],
    voteWeight: 1,
  },
};

export const ROLE_TEAM_LABEL: Record<string, string> = {
  iyi: "MAHALLE",
  kotu: "ÇETE",
};
