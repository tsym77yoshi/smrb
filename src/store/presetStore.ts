import { defineStore } from 'pinia'
import type { ColorHEXA } from '@/type/utilityType';
import type { VoiceItem } from '@/type/itemType';

type Character = {
  name: string;
  groupName: string;
  color: ColorHEXA;
  layer:0;// 未実装
  // keyGesture
  voice:{
    API:string;// NONE
    arg:string;
  };
}
export const useCharaStore = defineStore('chara', () => {

}, {
  persist: {
    key: "setting",
    storage: localStorage,
  }
});

type Jimaku = VoiceItem & {
  
}