import type { Item } from "@/type/itemType"

// アイテムが有効な値を示しているかどうかの判定
export const isValidItemPos = (checkItems: Item[]): boolean => {
  let itemLayers: Item[][] = [];
  for (const item of checkItems) {
    // おかしい値ではないか判定
    if (item.layer < 0 || item.frame < 0 || item.length <= 0) {
      return false;
    }
    // レイヤーへ追加
    while (itemLayers.length <= item.layer) {
      itemLayers.push([]);
    }
    itemLayers[item.layer].push(item);
  }
  for (const layer of itemLayers) {
    // レイヤー内並び替え
    layer.sort((a, b) => {
      return a.frame - b.frame
    })
    // レイヤー内で被りがないか
    for (let i = 0; i < layer.length - 1; i++) {
      if (layer[i].frame + layer[i].length > layer[i + 1].frame) {
        return false;
      }
    }
  }
  return true;
}