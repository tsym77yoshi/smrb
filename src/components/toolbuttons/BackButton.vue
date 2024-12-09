<!-- PageDialogの左下にfixedされているtimelineに戻るためのボタン -->

<template>
  <q-btn icon="arrow_back" class="close-button" @click.stop="click" size="xl"
  :style="{ opacity: isDisabled ? '50%' : '100%' }" />
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router";

const router = useRouter();
const isDisabled = ref(true)
const DISABLE_TIME = 5000;// ms
const click = () => {
  if (isDisabled.value) {
    isDisabled.value = false;
    setTimeout(() => { isDisabled.value = true }, DISABLE_TIME)
    return;
  }
  backToTimeline()
}
const backToTimeline = () => {
  router.push({ name: "timeline" });
};
</script>

<style scoped>
.close-button {
  padding: 0.5rem 1rem;
  border-radius: 0 500px 500px 0;
  background-color: var(--color-primary);
  position: fixed;
  left: 0;
  bottom: var(--height-foot-tool-bar);
  z-index: 100;
}
</style>