import type { ColorHEXA } from "./utilityType";
import type { VoiceItem } from "./itemType";

export type Character = {
  name: string;
  software: string; // ソフト名(同名キャラクターで別ソフトがあるので), 例: 小夜/SAYO CoeFontとVoicevox等
  color: ColorHEXA;
  credit: string; // クレジット
  parentContentId: string; // 親作品ID(スペース区切りでいけるように)
  audioTerms: string;// 音声の利用規約
  charaTerms: string;// キャラクターの利用規約
  remark: string; // メモ
  tachie: Tachie;
  jimaku: VoiceItem;
}
type Tachie = {
  //tachieType:"";
  fileIds: number[];
  remark: string;
}