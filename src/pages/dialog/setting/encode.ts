import { useItemsStore, useStateStore, useVideoInfoStore } from "@/store/tlStore";
import { Renderer } from "@/renderer/renderer";
import muxjs from "mux.js";

let items: ReturnType<typeof useItemsStore>;
let state: ReturnType<typeof useStateStore>;
let videoInfo: ReturnType<typeof useVideoInfoStore>;

const firstLoad = () =>{
  if(!items){
    items =useItemsStore();
    state = useStateStore();
    videoInfo = useVideoInfoStore();
  }
}

// 推奨形式について: https://qa.nicovideo.jp/faq/show/5685?site_domain=default
const H264_CODEC = "avc1.640028";// H264. high profile, なんか, lv
const autoBitrate = [
  { height: 1080, bitrate: 12_000_000 },
  { height: 720, bitrate: 6_000_000 },
  { height: 480, bitrate: 2_000_000 },
]

export const encode = async () => {
  if (items.lastFrame == 0) {
    return;
  }
  if (items.lastFrame > 100000) {
    console.error("フレーム数多すぎます！！");
    alert("フレームが多すぎます。最終フレーム:" + items.lastFrame)
    return;
  }
  firstLoad();
  await encodeVideo();
  await encodeAudio();
  downloadMP4();
}
const encodeVideo = async () => {
  const offscreen = new OffscreenCanvas(videoInfo.width, videoInfo.height);
  const renderer = new Renderer(offscreen.getContext("webgl"));

  const init: VideoEncoderInit = {
    output: handleVideoChunk,
    error: (e: Error) => {
      console.log(e.message);
    },
  };

  const config = {
    codec: H264_CODEC,
    width: videoInfo.width,
    height: videoInfo.height,
    bitrate: videoInfo.isAutoVideoBitrate ? (autoBitrate.find(v => v.height == videoInfo.height)?.bitrate ?? 6_000_000) : videoInfo.videoBitrate,
    framerate: videoInfo.fps,
  };

  const { supported } = await VideoEncoder.isConfigSupported(config);
  if (!supported) {
    console.error("形式がサポートされていません");
    alert("形式がサポートされていません");
    return;
  }
  const encoder = new VideoEncoder(init);
  encoder.configure(config);

  for (let i = 0; i < items.lastFrame; i++) {
    renderer.render(state.frame, items.layers);
    const frame = new VideoFrame(offscreen, { timestamp: i * (1_000_000 / videoInfo.fps) }); // マイクロ秒なので1_000_000倍
    encoder.encode(frame);
    frame.close();
  };

  await encoder.flush().then(() => {
    encoder.close();
    console.log('VideoEncoderはflush、closeが完了しました');
  });
}
// audioEncoderはsafariもXなので
const encodeAudio = async () => {
}

const videoChunks: Uint8Array[] = [];
const audioChunks: Uint8Array[] = [];

const handleVideoChunk = (chunk: EncodedVideoChunk) => {
  const chunkData = new Uint8Array(chunk.byteLength);
  chunk.copyTo(chunkData);
  videoChunks.push(chunkData);
}

const handleAudioChunk = (chunk: EncodedAudioChunk) => {
  const chunkData = new Uint8Array(chunk.byteLength);
  chunk.copyTo(chunkData);
  audioChunks.push(chunkData);
}

const downloadMP4 = () => {
  if (videoChunks.length === 0 || audioChunks.length === 0) {
    console.warn("Both video and audio chunks are required for MP4 download.");
    return;
  }

  const muxer = new muxjs.mp4.Transmuxer();

  videoChunks.forEach((chunk) => muxer.push(chunk));
  audioChunks.forEach((chunk) => muxer.push(chunk));

  muxer.flush();

  muxer.on('data', (segment) => {
    const blob = new Blob([segment.data], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'output.mp4';
    a.click();

    URL.revokeObjectURL(url);
  });
}