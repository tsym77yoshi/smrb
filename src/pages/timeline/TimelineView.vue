<template>
  <q-layout view="hHh lpR fFf" style="height:100vw">

    <q-page-container style="height:100%">
      <!-- separator調整のためにrenderのz-indexが2, separatorが1 -->
      <q-splitter v-model="splitterModel" horizontal style="height:100%" :limits="[10, 90]" before-class="z2"
        separator-class="z1">

        <template v-slot:before>
          <div style="display:flex;height:100%">
            <!-- 100%にすると少しずれるっぽい(?)整数の関係かな..? -->
            <RenderView style="height:95%;" />
          </div>
        </template>

        <template v-slot:separator>
          <q-avatar color="primary" text-color="white" size="40px" icon="drag_indicator" />
        </template>

        <template v-slot:after>
          <Timeline class="center-content" />
        </template>

      </q-splitter>

      <q-page-sticky position="bottom-right"  style="z-index:3">
        <div class="column q-pa-sm">
          <AddItemButton class="q-mt-sm" />
          <ModeButton class="q-mt-sm" />
        </div>
      </q-page-sticky>
    </q-page-container>

    <FootToolbar />

  </q-layout>
</template>
<script setup lang="ts">
import { ref } from "vue";
import RenderView from "@/components/RenderView.vue";
import Timeline from "@/pages/timeline/Timeline/Timeline.vue";
import FootToolbar from "@/pages/timeline/Timeline/FootToolbar.vue";
import AddItemButton from "@/components/toolbuttons/AddItemButton.vue";
import ModeButton from "@/components/toolbuttons/ModeButton.vue";
import { touchStore } from "@/store/tlStore";

const splitterModel = ref(20)

const touch = touchStore();
// タッチの数を追跡
document.addEventListener("pointerdown", (event: PointerEvent) => {
  touch.activeTouches.add(event.pointerId);
});
document.addEventListener("pointerup", (event: PointerEvent) => {
  touch.activeTouches.delete(event.pointerId);
});
document.addEventListener("pointerleave", (event: PointerEvent) => {
  touch.activeTouches.delete(event.pointerId);
});
// touchの方が良さそう？
document.addEventListener("touchstart", (event: TouchEvent) => {
  touch.setTouchNumber(event.touches.length)
});
document.addEventListener("touchend", (event: TouchEvent) => {
  touch.setTouchNumber(event.touches.length)
});
</script>

<style scoped>
.center-content {
  box-sizing: content-box;
  flex-shrink: 1;
}
</style>

<style>
.z2 {
  z-index: 2
}

.z1 {
  z-index: 1
}
</style>