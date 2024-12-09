<template>
  <q-list bordered>
    <q-item clickable v-ripple v-for="buttonItem in buttonItems" @click="buttonItem.action" :key="buttonItem.name">
      <q-item-section avatar>
        <q-avatar rounded>
          <q-icon :name="buttonItem.icon" />
        </q-avatar>
      </q-item-section>
      <q-item-section>{{ buttonItem.name }}</q-item-section>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
export type ButtonItemType = {
  name: string;
  action: () => void;
  icon: string;
};
const props = defineProps<{
  buttonItems: ButtonItemType[];
}>();
</script>