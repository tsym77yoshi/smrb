<template>
  <div>
    <!-- メインボタン -->
    <q-btn square color="primary" class="icon" glossy fab dense padding="1rem 0.1rem"
      :icon="menuItems[0].icon" :label="menuItems[0].label" @click="menuItems[0].action"
      v-touch-pan.prevent.mouse="onPan">

      <!-- スワイプで出てくるボタン一覧 -->
      <q-menu anchor="bottom left" v-model="fade" class="column">
        <q-list>
          <q-item v-for="item in menuItems.reverse()" :key="item.label" clickable
            @click="() => { item.action(); fade=false; }">
            <q-item-section>{{ item.label }}</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

export type MenuItem = {
  icon: string;
  label: string;
  action: () => void;
};

const props = defineProps<{
  menuItems: MenuItem[]
}>();

const fade = ref(false)
function onPan(ev: any) {
  if (ev.isFinal && ev.direction === 'up') {
    fade.value = true;
  }
}
</script>
<style scoped>
.icon {
  flex: 1;
  font-size: 0.67rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>