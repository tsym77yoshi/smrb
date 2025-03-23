import type { TLItem } from "@/types/itemType";

export const getItemColor = (item: TLItem): string => {
  if(item.isHidden) {
    return "gray";
  }
  switch (item.type) {
    case "text":
    case "image":
    case "video":
    case "shape":
      return "blue";
    case "audio":
      return "red";
  }
  return "";
};