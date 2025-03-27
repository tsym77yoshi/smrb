<template>
  <div v-for="(itemGroup, index) in itemGroups" :key="index">
    <q-expansion-item switch-toggle-side expand-separator defaultOpened expand-icon="arrow_drop_down_circle"
      :label="itemGroup.name">
      <q-card style="background-color: var(--color-background)">
        <q-card-section>
          <div v-for="(
itemProperty, propertyKey, index2
                  ) in itemGroup.properties" :key="index2" style="
                    margin-bottom: 1rem;
                  ">
              <slot :itemProperty="itemProperty" :propertyKey="propertyKey"></slot>
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </div>
</template>

<script setup lang="ts">
import type { ItemPropertyGroupView } from "./propertyViewType";
import { defineProps } from "vue";
const props = defineProps<{
  itemGroups: ItemPropertyGroupView[];
}>();
</script>