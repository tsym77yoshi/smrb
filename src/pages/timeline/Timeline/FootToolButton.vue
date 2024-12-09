<template>
  <q-btn square color="primary" class="icon" glossy fab :icon="icon" :label="label" dense padding="1rem 0.1rem"/>
</template>

<script setup lang="ts">
const props = defineProps<{
  icon: string,
  label:string,
}>();
</script>
<style scoped>
.icon {
  flex: 1;
  font-size: 0.67rem;
}
</style>