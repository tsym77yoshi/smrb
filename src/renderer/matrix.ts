// 3x3行列と3次元ベクトル
// 2次元の回転、平行移動、拡大縮小を行うためのクラス
export class Matrix3 {
  //    S11 S12 S13 ->
  // -> S21 S22 S23 ->
  // -> S31 S32 S33の順番で格納
  matrix: [number, number, number, number, number, number, number, number, number];
  constructor(arrays: [number, number, number, number, number, number, number, number, number]) {
    this.matrix = arrays;
  }
  // this * mat3
  multiplyM(mat3: Matrix3) {
    return new Matrix3([
      this.matrix[0] * mat3.matrix[0] + this.matrix[1] * mat3.matrix[3] + this.matrix[2] * mat3.matrix[6],
      this.matrix[0] * mat3.matrix[1] + this.matrix[1] * mat3.matrix[4] + this.matrix[2] * mat3.matrix[7],
      this.matrix[0] * mat3.matrix[2] + this.matrix[1] * mat3.matrix[5] + this.matrix[2] * mat3.matrix[8],
      this.matrix[3] * mat3.matrix[0] + this.matrix[4] * mat3.matrix[3] + this.matrix[5] * mat3.matrix[6],
      this.matrix[3] * mat3.matrix[1] + this.matrix[4] * mat3.matrix[4] + this.matrix[5] * mat3.matrix[7],
      this.matrix[3] * mat3.matrix[2] + this.matrix[4] * mat3.matrix[5] + this.matrix[5] * mat3.matrix[8],
      this.matrix[6] * mat3.matrix[0] + this.matrix[7] * mat3.matrix[3] + this.matrix[8] * mat3.matrix[6],
      this.matrix[6] * mat3.matrix[1] + this.matrix[7] * mat3.matrix[4] + this.matrix[8] * mat3.matrix[7],
      this.matrix[6] * mat3.matrix[2] + this.matrix[7] * mat3.matrix[5] + this.matrix[8] * mat3.matrix[8]]);
  }/* 使ってない
  multiplyV(v3: [number, number, number]) {
    return [
      this.matrix[0] * v3[0] + this.matrix[1] * v3[1] + this.matrix[2] * v3[2],
      this.matrix[3] * v3[0] + this.matrix[4] * v3[1] + this.matrix[5] * v3[2],
      this.matrix[6] * v3[0] + this.matrix[7] * v3[1] + this.matrix[8] * v3[2]];
  } */
 transpose() {
    return new Matrix3([this.matrix[0], this.matrix[3], this.matrix[6], this.matrix[1], this.matrix[4], this.matrix[7], this.matrix[2], this.matrix[5], this.matrix[8]]);
  }
  static fromRotation(angle: number) {
    return new Matrix3([Math.cos(angle), -Math.sin(angle), 0.0, Math.sin(angle), Math.cos(angle), 0.0, 0.0, 0.0, 1.0]);
  }
  static fromTranslation(dX: number, dY: number) {
    return new Matrix3([1.0, 0.0, dX, 0.0, 1.0, dY, 0.0, 0.0, 1.0]);
  }
  static fromScale(sX: number, sY: number) {
    return new Matrix3([sX, 0.0, 0.0, 0.0, sY, 0.0, 0.0, 0.0, 1.0]);
  }
}