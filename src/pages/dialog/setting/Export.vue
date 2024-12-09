<template>
  <div>
    <RenderView ref="render" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import RenderView from "@/components/RenderView.vue";
import { useItemsStore, useStateStore, useVideoInfoStore } from "@/store/tlStore";

//const offscreen = new OffscreenCanvas(256, 256);

const items = useItemsStore();
const state = useStateStore();
const videoInfo = useVideoInfoStore();

const render = ref();

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const ffmpeg = new FFmpeg;

const load = async () => {
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'

  ffmpeg.on('log', ({ message }) => {
    console.log(message);
  });
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    //workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
  });
}

const transcode = async () => {
  //await ffmpeg.exec(['-i', 'input.webm', 'output.mp4']);
  await ffmpeg.exec(['-r', videoInfo.fps.toString(), '-i', 'image_%05d.png', '-vcodec', 'libx264', '-pix_fmt', 'yuv420p', 'output.mp4']);
  const data = await ffmpeg.readFile('output.mp4');
  console.log(data)

  const a = document.createElement("a")
  const url = URL.createObjectURL(new Blob([(data as Uint8Array).buffer], { type: 'video/mp4' }));
  a.href = url;
  a.download = "output.mp4"
  a.click();
  URL.revokeObjectURL(url);
}

const record = async () => {

  if (items.lastFrame == 0) {
    return;
  }
  if (!ffmpeg.loaded) {
    console.log("loading")
    await load();
  }
  if (items.lastFrame > 100000) {
    console.error("フレーム数多すぎ！想定外！！");
    return;
  }
  for (let i = 0; i < items.lastFrame; i++) {
    state.setFrame(i);
    const renban = i.toString().padStart(5, '0');
    await new Promise<void>((resolve) => {
    (render.value.renderView as HTMLCanvasElement).toBlob(async (blob) => {
      if (blob != null) {
        const arrayBuffer = await blob.arrayBuffer();
        await ffmpeg.writeFile(`image_${renban}.png`, new Uint8Array(arrayBuffer));
      }
      resolve();
    });
  });

    /* await new Promise(resolve => {
      (render.value.renderView as HTMLCanvasElement).toBlob(async (blob) => {
        if (blob != null) {
          const arrayBuffer = await blob.arrayBuffer();
          console.log(arrayBuffer.byteLength)
          await ffmpeg.writeFile(`image_${renban}.png`, new Uint8Array(arrayBuffer));
          console.log(`image_${renban}.png`)
        }
      })
      resolve("")
    }) */
  }
  console.log("st")
  await transcode();
}


defineExpose({ record })
</script>