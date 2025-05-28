export type LoadedFile = {
  id: number;
  file: HTMLImageElement | AudioBuffer;// 後で追加
}
export type FileInfo = {
  id: number;
  status: FileStatus;
  fileType: FileType;
  duration?: number;// ファイルの秒数(あるものだけ)
} & FileSearchInfo & FileCreditDetail;
export type FileStatus = "unload" | "loading" | "loaded" | "missing" | "error";
export const fileTypes = ["image", "audio", "video"] as const;
export type FileType = typeof fileTypes[number];
export type FileSearchInfo = {
  name: string;
  tags: string[];
  date: string;
  characterId: undefined | number;
}
export type FileCreditDetail = {
  parentId: string;// 親作品
  credit: string;// クレジット
  remark: string;// フリー記述欄
}