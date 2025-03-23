import type { ColorHEXA } from "@/types/utilityType";

// 全て0~1の範囲
export const convertColorHEXA = (colorHEXA: ColorHEXA): [number, number, number, number] => {
  // #を消す
  let hex = colorHEXA.replace(/^#/, "");

  // 短いやつをのばす
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  } else if (hex.length === 4) {
    hex = hex.split('').map(c => c + c).join('');
  }

  /* // フォーマット検証
  if (!/^[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(hex)) {
    return null;
  } */

  // RGBAを変換
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;
  let a = hex.length === 8 ? parseInt(hex.substring(6, 8), 16) / 255 : 1;

  return [r, g, b, a];
}