<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

/* navigator.storage.estimate().then(function (estimate: StorageEstimate) {
  console.log("容量の使用率(%)"+(estimate?.usage / estimate?.quota) *
  100)
});
setInterval(()=>{
  const data = localStorage.getItem('file')
  if(data!=null){
    console.log(data)
  }
},1); */
</script>

<template>
  <RouterView />
</template>
