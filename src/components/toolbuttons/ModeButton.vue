<template>
  <q-fab v-model="fab" vertical-actions-align="right" color="primary" glossy direction="left" label="モード"
    icon="keyboard_arrow_left" @click="setUserModeNormal">
    <q-fab color="primary" label="複数選択" @click.stop="swithUserMode" :glossy="isNotSelectMode" icon="highlight_alt"
      square />
    <q-fab-action color="primary" square label="倍率">
      <q-slider v-model="logppf" thumb-color="white" color="white" :min="1.1" :max="20"
        style="width:100px;padding:0 10px;" @update:model-value="setppf" />
    </q-fab-action>
  </q-fab>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { useStateStore } from "@/store/tlStore"

const fab = ref(false)

const state = useStateStore();

const isNotSelectMode = computed(() =>
  state.userMode != "select"
)

const setUserModeNormal = () => {
  state.userMode = "normal"
  console.log("UserMode changed to",state.userMode)
}
const swithUserMode = () => {
  if (state.userMode == "select") {
    state.userMode = "normal"
  }
  else {
    state.userMode = "select"
  }
  console.log("UserMode changed to",state.userMode)
}

const logppf = ref<number>(10 ^ (state.ppf))

const setppf = (value: number | null) => {
  if (value != null) {
    state.ppf = Math.log10(value)
  }
}

</script>