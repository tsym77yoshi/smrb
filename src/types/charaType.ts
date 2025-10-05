import type { ColorHEXA } from "./utilityType";

export type Character = {
  characterId: number;
  name: string;
  groupName: string;
  software: string; // ソフト名(同名キャラクターで別ソフトがあるので)
  color1: ColorHEXA;
  color2: ColorHEXA;
  credit: string; // クレジット
  parentContentId: string; // 親作品ID(スペース区切りでいけるように)
  audioTerms: string;// 音声の利用規約
  charaTerms: string;// キャラクターの利用規約
  remark: string; // メモ
  tachies: Tachie[];
  // 字幕はキャラに紐づけるのではなくする
}
type Tachie = {
  tachieType: "ichimai" | "psd";
  fileIds: number[];
  remark: string;
}