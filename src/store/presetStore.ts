import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { ColorHEXA } from '@/types/utilityType';
import type { VoiceItem } from '@/types/itemType';
import type { Character } from '@/types/charaType';

export const useCharacterStore = defineStore('chara', () => {
  const characters = ref<Character[]>([]);

  const getCharacterIdByName = (name: string) => {
    return characters.value.find((chara) => chara.name == name)?.characterId;
  }

  return { characters, getCharacterIdByName }
}, {
  persist: {
    key: "character",
    storage: localStorage,
    pick: ["characters"],
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