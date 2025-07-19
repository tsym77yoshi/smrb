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

/* (function() {
  const logDiv = document.createElement('div');
  logDiv.style = 'position:fixed;bottom:0;left:0;width:100%;max-height:50%;overflow:auto;background:#000000f0;color:#0f0;font:12px monospace;z-index:9999;padding:4px;';
  document.body.appendChild(logDiv);

  const origLog = console.log;
  const origWarn = console.warn;
  const origErr = console.error;
  console.log = function(...args) {
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
    const line = document.createElement('div');
    line.textContent = msg;
    logDiv.appendChild(line);
    origLog.apply(console, args);
  };
  console.warn = function(...args) {
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
    const line = document.createElement('div');
    line.textContent = msg;
    line.style.color = '#ff0';
    logDiv.appendChild(line);
    origWarn.apply(console, args);
  };
  console.error = function(...args) {
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
    const line = document.createElement('div');
    line.textContent = msg;
    line.style.color = '#f00';
    logDiv.appendChild(line);
    origErr.apply(console, args);
  };

  console.log('🔧 Console overlay initialized');
})(); */
</script>

<template>
  <RouterView />
</template>
