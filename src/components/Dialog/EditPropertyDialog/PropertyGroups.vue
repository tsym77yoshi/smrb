<template>
  <div v-for="(propertyGroup, index) in propertyGroups" :key="index">
    <q-expansion-item switch-toggle-side expand-separator defaultOpened expand-icon="arrow_drop_down_circle"
      :label="propertyGroup.name">
      <q-card style="background-color: var(--color-background)">
        <q-card-section>
          <div v-for="(property, propertyKey, index2) in propertyGroup.properties" :key="index2"
            style="margin-bottom: 1rem;">
            <slot :property="property" :propertyKey="propertyKey"></slot>
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </div>
</template>

<script setup lang="ts">
import type { PropertyGroupView } from "./propertyViewTypes";
import { defineProps } from "vue";
const props = defineProps<{
  propertyGroups: PropertyGroupView[];
}>();
</script>