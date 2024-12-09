<template>
  <FullPageDialog title="台本から追加">
    <DraggableVoice />
  </FullPageDialog>
</template>

<script setup lang="ts">
import FullPageDialog from "@/components/DialogPage/FullPageDialog.vue";
import DraggableVoice from "@/pages/dialog/addItem/AddVoiceScript/DraggableVoice.vue";

</script>