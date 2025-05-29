import { useItemsStore, useStateStore, useVideoInfoStore } from "@/store/tlStore";
import { Renderer } from "@/renderer/video/renderer";
import { AudioPlayer } from "@/renderer/audio/audio";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

const ffmpeg = new FFmpeg;

let items: ReturnType<typeof useItemsStore>;
let state: ReturnType<typeof useStateStore>;
let videoInfo: ReturnType<typeof useVideoInfoStore>;

const firstLoad = () => {
  if (!items) {
    items = useItemsStore();
    state = useStateStore();
    videoInfo = useVideoInfoStore();
  }
}
const load = async (displayMessage: (message: string) => void) => {
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'

  ffmpeg.on('log', ({ message }) => {
    displayMessage(message);
  });
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    //workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
  });
}

export const encodeByFFmpeg = async (displayMessage: (message: string) => void) => {
  firstLoad();
  if (items.lastFrame === 0) return;

  if (!ffmpeg.loaded) {
    displayMessage("FFmpegを読み込み中...");
    await load(displayMessage);
  }

  if (items.lastFrame > 100000) {
    displayMessage("フレーム数が多すぎます。最終フレーム: " + items.lastFrame);
    return;
  }

  await writeVideo();
  await transcodeVideo();

  await writeAudio();
  await mixAudioVideo();

  await downloadMP4();
}

const transcodeVideo = async () => {
  //await ffmpeg.exec(['-i', 'input.webm', 'output.mp4']);
  await ffmpeg.exec(['-r', videoInfo.fps.toString(), '-i', 'image_%05d.png', '-vcodec', 'libx264', '-pix_fmt', 'yuv420p', 'output.mp4']);
}
const mixAudioVideo = async () => {
  await ffmpeg.exec([
    '-i', 'output.mp4',
    '-i', 'audio.wav',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-shortest',
    'output_with_audio.mp4'
  ]);
}
const downloadMP4 = async () => {
  const data = await ffmpeg.readFile('output_with_audio.mp4');
  console.log(data)

  const a = document.createElement("a")
  const url = URL.createObjectURL(new Blob([(data as Uint8Array).buffer], { type: 'video/mp4' }));
  a.href = url;
  a.download = "output.mp4"
  a.click();
  URL.revokeObjectURL(url);
}

const MAX_CONCURRENT = 10;

const writeVideo = async () => {
  const width = videoInfo.width;
  const height = videoInfo.height;

  const tasks: Promise<void>[] = [];
  const canvases: OffscreenCanvas[] = [];
  const webgls: WebGLRenderingContext[] = [];
  for (let i = 0; i < MAX_CONCURRENT; i++) {
    const canvas = new OffscreenCanvas(width, height);
    const gl = canvas.getContext('webgl');
    if (!gl) throw new Error("WebGL not supported");
    canvases.push(canvas);
    webgls.push(gl);
  }

  for (let i = 0; i < items.lastFrame; i++) {
    const task = (async (frameIndex: number) => {
      const renban = frameIndex.toString().padStart(5, '0');
      const renderer = new Renderer(webgls[frameIndex % MAX_CONCURRENT]);
      
      // ここで描画を反映させる必要あり
      renderer.render(frameIndex, items.layers);

      // PNG へエクスポート
      const blob = await canvases[frameIndex % MAX_CONCURRENT].convertToBlob({ type: 'image/png' });
      const arrayBuffer = await blob.arrayBuffer();
      await ffmpeg.writeFile(`image_${renban}.png`, new Uint8Array(arrayBuffer));
    })(i);

    tasks.push(task);

    if (tasks.length >= MAX_CONCURRENT) {
      await Promise.all(tasks);
      tasks.length = 0;
    }
  }

  if (tasks.length > 0) {
    await Promise.all(tasks);
  }
};
const writeAudio = async () => {
  const audioPlayer = new AudioPlayer();
  const audioBuffer = await audioPlayer.record(); // AudioBuffer

  const wavData = encodeWav(audioBuffer);
  await ffmpeg.writeFile('audio.wav', wavData);
}
function encodeWav(audioBuffer: AudioBuffer): Uint8Array {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const blockAlign = numChannels * bitDepth / 8;
  const byteRate = sampleRate * blockAlign;
  const samples = audioBuffer.length;

  const dataLength = samples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  // RIFF header
  let offset = 0;
  const writeString = (str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset++, str.charCodeAt(i));
    }
  };

  writeString('RIFF');
  view.setUint32(offset, 36 + dataLength, true); offset += 4;
  writeString('WAVE');

  // fmt chunk
  writeString('fmt ');
  view.setUint32(offset, 16, true); offset += 4; // fmt chunk size
  view.setUint16(offset, format, true); offset += 2;
  view.setUint16(offset, numChannels, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, byteRate, true); offset += 4;
  view.setUint16(offset, blockAlign, true); offset += 2;
  view.setUint16(offset, bitDepth, true); offset += 2;

  // data chunk
  writeString('data');
  view.setUint32(offset, dataLength, true); offset += 4;

  // interleave audio samples
  for (let i = 0; i < samples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = audioBuffer.getChannelData(ch)[i];
      const s = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Uint8Array(buffer);
}
