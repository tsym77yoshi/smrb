<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>
          <q-avatar>
            <img src="/icon.svg" />
          </q-avatar>
          {{ title }}
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <slot></slot>
    </q-page-container>

    <BackButton />
  </q-layout>
</template>

<script setup lang="ts">
import BackButton from "@/components/toolbuttons/BackButton.vue";
const props = defineProps<{
  title: string,
}>();
</script>

<style scoped>
.title {
  font-size: 3rem;
  text-align: center;
  background-color: var(--color-primary);
  color: var(--color-display-on-primary);
  margin-bottom: 0.5rem;
}
</style>