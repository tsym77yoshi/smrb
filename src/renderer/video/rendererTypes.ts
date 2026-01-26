// 座標系：中心原点、右上が正の方向
export type ItemOption = {
  x: number;// 中心原点から回転中心までの符号付き距離x
  y: number;// 中心原点から回転中心までの符号付き距離y
  width: number;// 幅
  height: number;// 高さ
  pivotX: number;// 回転拡大用の中心から映しているものの中心までの符号付き距離x
  pivotY: number;// 回転拡大用の中心から映しているものの中心までの符号付き距離y
  itemFrame: number;// アイテム開始からのフレーム数
}
