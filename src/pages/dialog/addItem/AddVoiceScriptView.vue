<template>
  <FullPageDialog title="台本から追加">
    <loadVoice />
  </FullPageDialog>
</template>

<script setup lang="ts">
import loadVoice from "@/voice/load/loadVoice.vue";
import FullPageDialog from "@/components/DialogPage/FullPageDialog.vue";
import DraggableVoice from "@/pages/dialog/addItem/AddVoiceScript/DraggableVoice.vue";

</script>