<template>
  <div>
    <div>
      <div style="height:50%;overflow: hidden;position:absolute;width:100%">
        <div style="display: flex;width: 100%; align-items: stretch;height:100%;overflow-y: scroll;">
          <div class="flex-child left-element">
            <q-item dense v-for="(element, index) in audios" :key="index" class="serif" style="margin:1px 0">
              <CharaIcon character-name="小夜ちゃん"/>
              <div style="overflow: hidden;">{{ element.name }}</div>
            </q-item>
          </div>
          <draggable class="list-group flex-child right-element" :list="audios" handle=".handle" item-key="id">
            <template #item="{ element, index }">
              <q-item dense class="handle" style="display: flex;padding:2px 0;margin:1px 0">
                <!--stop_circle-->
                <q-btn icon="play_circle" left dense rounded @click="console.log('hey')" />
                <div style="overflow: hidden;white-space: nowrap;">{{ element.name }}</div>
                <q-btn icon="delete" @click="removeAt(index)" dense flat style="margin-left: auto;" />
              </q-item>
            </template>
          </draggable>
        </div>
      </div>

      <div style="position:absolute;bottom:20%;width:100%;display: flex;">
        <q-input v-model="script" filled type="textarea" color="primary" label="台本を入力" hint="'キャラクター名,セリフ'のように入力してください"
          class="left-element">
          <template v-slot:append>
            <q-btn round dense icon="send" />
            
          </template>
        </q-input>
        <div class="right-element"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import draggable from "vuedraggable";
import CharaIcon  from "@/components/toolbuttons/CharaIcon.vue";

const serifs = ref(
  [
    {}
  ]
);


const audios = ref(
  [
    { id: 0, name: "えええあ", },
    { id: 1, name: "こにちは", },
    { id: 2, name: "こんには", },
    { id: 3, name: "んにちは", },
    { id: 4, name: "こんにち", },
    { id: 5, name: "やあぁみeeeeeeeeeeeeeeA", },
    { id: 6, name: "んにちは", },
    { id: 7, name: "こんにち", },
    { id: 8, name: "やあぁみ", },
    { id: 9, name: "やあぁみ", },
    { id: 10, name: "んにちは", },
    { id: 11, name: "こんにち", },
    { id: 12, name: "やあぁみ", },
    { id: 13, name: "んにちは", },
    { id: 14, name: "こんにち", },
    { id: 15, name: "やあぁみ", },
  ]
)

const add = (insert: number) => {

}
const removeAt = (index: number) => {

}

const script = ref();
const addVoiceFromScript = () => {

}
</script>

<style scoped>
.flex-child {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.serif {
  width: 100%;
  height: 100%;
  border-right: 0;
  border-radius: 5px 0 0 5px;
  background-color: var(--color-primary);
}
.left-element {
  width: 67%;
}
.right-element {
  width: 33%;
}

.handle {
  background-color: var(--color-primary);
}
</style>