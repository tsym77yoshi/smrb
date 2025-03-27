<template>
  <q-dialog v-model="isDisplayDialog">
    <div class="row justify-space" style="background-color: #555555ee;">
      <q-card v-for="(animationType, index) in animationTypeLabelAndValues" :key="index" class="col-3"
        style="padding: 0;overflow: hidden;" bordered flat @click="onCardClicked(animationType.value)">
        <canvas ref="canvases" width="100" height="100" style="background-color: black;width:100%"></canvas>
        <q-card-section style="padding:0">
          <div>{{ animationType.label }}</div>
        </q-card-section>
      </q-card>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";
import type { AnimationType, VarNumbers } from "@/types/itemType";
import { animationTypeLabelAndValues } from "@/types/itemType";
import { animation } from "@/data/animationCurve";

const props = defineProps<{
  setAnimationType: (name: AnimationType) => void;
}>();

const isDisplayDialog = ref(false);

const onCardClicked = (animationType: AnimationType) => {
  props.setAnimationType(animationType)
  isDisplayDialog.value = false;
}

const canvases = ref<HTMLCanvasElement[]>([]);

const show = () => {
  isDisplayDialog.value = true;
  nextTick(() => {
    drawCanvas();
  })
}
const drawCanvas = () => {
  canvases.value.forEach((canvas, i) => {
    drawAnimationOnCanvas(canvas, animationTypeLabelAndValues[i].value);
  })
};

const drawAnimationOnCanvas = (c: HTMLCanvasElement, animationType: AnimationType) => {
  if (!c) { console.error("canvasの取得に失敗しました"); return; }
  const ctx = c.getContext("2d");
  if (!ctx) { console.error("canvasのcontextの取得に失敗しました"); return; }
  ctx.clearRect(0, 0, c.width, c.height);

  ctx.fillStyle = "white";
  const PADDING = 10;
  const POINT_COUNT = 50;
  const POINT_RADIUS = 1.5;
  const width = c.width;
  const height = c.height - PADDING * 2;
  ctx.strokeStyle = "#eeeeee";
  ctx.beginPath();
  ctx.strokeRect(0, PADDING, width, height);
  ctx.closePath();
  ctx.stroke();
  for (let i = 0; i < POINT_COUNT + 1; i++) {
    ctx.beginPath();
    const setVarNum: VarNumbers = {
      values: [
        { value: 0 },
        { value: 1 },
      ],
      span: 0.015,
      animationType: animationType,
    }
    // y: 0~1の範囲で
    const y = animation(setVarNum, i / POINT_COUNT, { frames: [], count: 0 }, 1, 30);
    ctx.arc(i * width / POINT_COUNT, (1 - y) * height + PADDING, POINT_RADIUS, 0, 2 * Math.PI);
    ctx.fill();
  }
}
defineExpose({ show });

</script>