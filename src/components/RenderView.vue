<template>
  <canvas id="renderView" ref="renderView" :width="videoInfo.width" :height="videoInfo.height"
    style="background-color: aliceblue;"></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, watchEffect, watch } from "vue";
import {
  useItemsStore,
  useStateStore,
  useVideoInfoStore,
} from "@/store/tlStore";
import { Renderer } from "@/renderer/video/renderer";

const renderView = ref<HTMLCanvasElement | null>(null);
const videoInfo = useVideoInfoStore();

let renderer: Renderer;
const state = useStateStore();

const items = useItemsStore();

onMounted(() => {
  if (renderView.value) {
    if (renderView.value) {
      let ctx = renderView.value;
      renderer = new Renderer(ctx.getContext("webgl"));
      renderer.renderNotWaitLoad(state.frame, items.layers);
    } else {
      console.error("Canvasを取得できませんでした。");
    }
  } else {
    console.error("Canvasを取得できませんでした。");
  }
});
// 片方は片方でしか動かなかったので両方書いた
watch((items.items), () => {
  renderer.renderNotWaitLoad(state.frame, items.layers);
}, { deep: true });
watchEffect(() => {
  state.frame; // reactive化用のおまじない
  if (renderer == undefined) return;
  renderer.renderNotWaitLoad(state.frame, items.layers);
});

defineExpose({ renderView })
</script>

<style scoped>
#renderView {
  z-index: 1;
  margin: auto;
}
</style>