// Voicevoxを起動して http://127.0.0.1:50021/speakers からvoicevoxの各speaker idが取得できます
/*
const temp = ``// ここに中身を入れる
const jsonData = JSON.parse(temp)
let result = ""
for(const chara of jsonData){
  let result2 = ""
  for(const style of chara.styles){
    result2+=style.id+","
  }
  result+=("{speakerIds:["+result2+'],name:"'+chara.name+'"},\n')
}
console.log(result)
*/

type Speaker = {
  speakerIds: number[];
  name: string;
}
const speakers: Speaker[] = [
  { speakerIds: [2, 0, 6, 4, 36, 37,], name: "四国めたん" },
  { speakerIds: [3, 1, 7, 5, 22, 38, 75, 76,], name: "ずんだもん" },
  { speakerIds: [8,], name: "春日部つむぎ" },
  { speakerIds: [10,], name: "雨晴はう" },
  { speakerIds: [9, 65,], name: "波音リツ" },
  { speakerIds: [11, 39, 40, 41,], name: "玄野武宏" },
  { speakerIds: [12, 32, 33, 34, 35,], name: "白上虎太郎" },
  { speakerIds: [13, 81, 82, 83, 84, 85, 86,], name: "青山龍星" },
  { speakerIds: [14,], name: "冥鳴ひまり" },
  { speakerIds: [16, 15, 18, 17, 19,], name: "九州そら" },
  { speakerIds: [20, 66, 77, 78, 79, 80,], name: "もち子さん" },
  { speakerIds: [21,], name: "剣崎雌雄" },
  { speakerIds: [23, 24, 25, 26,], name: "WhiteCUL" },
  { speakerIds: [27, 28, 87, 88,], name: "後鬼" },
  { speakerIds: [29, 30, 31,], name: "No.7" },
  { speakerIds: [42,], name: "ちび式じい" },
  { speakerIds: [43, 44, 45,], name: "櫻歌ミコ" },
  { speakerIds: [46,], name: "小夜/SAYO" },
  { speakerIds: [47, 48, 49, 50,], name: "ナースロボ＿タイプＴ" },
  { speakerIds: [51,], name: "†聖騎士 紅桜†" },
  { speakerIds: [52,], name: "雀松朱司" },
  { speakerIds: [53,], name: "麒ヶ島宗麟" },
  { speakerIds: [54,], name: "春歌ナナ" },
  { speakerIds: [55, 56, 57, 110, 111,], name: "猫使アル" },
  { speakerIds: [58, 59, 60, 112,], name: "猫使ビィ" },
  { speakerIds: [61, 62, 63, 64,], name: "中国うさぎ" },
  { speakerIds: [67,], name: "栗田まろん" },
  { speakerIds: [68,], name: "あいえるたん" },
  { speakerIds: [69, 70, 71, 72, 73,], name: "満別花丸" },
  { speakerIds: [74,], name: "琴詠ニア" },
  { speakerIds: [89,], name: "Voidoll" },
  { speakerIds: [90, 91, 92, 93,], name: "ぞん子" },
  { speakerIds: [94, 95, 96, 97, 98,], name: "中部つるぎ" },
  { speakerIds: [99, 101,], name: "離途" },
  { speakerIds: [100,], name: "黒沢冴白" },
  { speakerIds: [102, 103, 104, 105, 106,], name: "ユーレイちゃん" },
  { speakerIds: [107,], name: "東北ずん子" },
  { speakerIds: [108,], name: "東北きりたん" },
  { speakerIds: [109,], name: "東北イタコ" },
];

export const searchVoicevoxSpeakerName = (speakerId: number): string | undefined => {
  for (const speaker of speakers) {
    if (speaker.speakerIds.includes(speakerId)) {
      return speaker.name;
    }
  }
  return undefined;
}

// 順番_speakerIdのファイル名


// キャラ名「...のファイル