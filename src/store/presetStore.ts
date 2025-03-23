import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { ColorHEXA } from '@/types/utilityType';
import type { VoiceItem } from '@/types/itemType';

type Character = {
  name: string;
  groupName: string;
  color: ColorHEXA;
  layer: 0;// 未実装
  // keyGesture
  voice: {
    API: string;// NONE
    arg: string;
  };
}
export const useCharaStore = defineStore('chara', () => {
  const charas = ref<Character[]>([]);
  return { charas }
}, {
  persist: {
    key: "chara",
    storage: localStorage,
    pick: ["charas"],
  }
});

type Jimaku = VoiceItem & {
  // キャラごとに色を変えるか？みたいなこと
}
export const useJimakuStore = defineStore('jimaku', () => {
  const jimakus = ref<Jimaku[]>([]);
  return { jimakus }
}, {
  persist: {
    key: "jimaku",
    storage: localStorage,
    pick: ["jimakus"],
  }
});