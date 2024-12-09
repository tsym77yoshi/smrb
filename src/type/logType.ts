import type { TLItem } from "@/type/itemType";

export type Log = LogAdd | LogRemove | LogProperty /* | LogSelect */ | LogFailed;
export type LogAdd = {
  type: "add";
  itemIds: number[];
}
export type LogRemove = {
  type: "remove";
  items: TLItem[];
}
export type LogProperty = {
  type: "property";
  itemIds: number[];
  keyName: keyof TLItem;
  pastValues: unknown[];
}
/* export type LogSelect = {
  type: "select" | "deselect";
  itemIds: number[];
} */
export type LogFailed = {
  type: "failed";
}