<template>
  <q-card class="q-pa-md">
    <div class="text-caption text-grey q-mt-sm">ログ出力エリア</div>

    <q-separator class="q-my-sm" />

    <q-scroll-area style="height: 200px">
      <div v-for="(log, index) in logs" :key="index" class="text-body2">
        {{ log.message }}
      </div>
    </q-scroll-area>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'

type LogEntry = {
  message: string
}

const logs = ref<LogEntry[]>([])

const addLog = (message: string) => {
  logs.value.push({
    message
  })
}
const reset = () => {
  logs.value = []
}

defineExpose({
  reset,
  addLog,
});
</script>
