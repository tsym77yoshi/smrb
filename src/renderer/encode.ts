import { useItemsStore, useStateStore, useVideoInfoStore } from "@/store/tlStore";
import { Renderer } from "@/renderer/video/renderer";
import { AudioPlayer } from "@/renderer/audio/audio";
import muxjs from "mux.js";
import { encodeByFFmpeg } from "./encodeByFFmpeg";

// audioEncoderが存在していればそれを使い、していなければMediaRecorderを使う
/* 
let items: ReturnType<typeof useItemsStore>;
let state: ReturnType<typeof useStateStore>;
let videoInfo: ReturnType<typeof useVideoInfoStore>;

const firstLoad = () => {
  if (!items) {
    items = useItemsStore();
    state = useStateStore();
    videoInfo = useVideoInfoStore();
  }
} */

// 推奨形式について: https://qa.nicovideo.jp/faq/show/5685?site_domain=default
/* const H264_CODEC = "avc1.640028";// H264. high profile, なんか, lv
const autoBitrate = [
  { height: 1080, bitrate: 12_000_000 },
  { height: 720, bitrate: 6_000_000 },
  { height: 480, bitrate: 2_000_000 },
] */

export const encode = async (displayMessage: (message: string) => void) => {
  encodeByFFmpeg(displayMessage);
  return;
  /* firstLoad();
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

  console.log("動画と音声のエンコードが完了しました。ダウンロードを開始します。");
  downloadMP4(); */
}/* 
const encodeVideo = async () => {
  console.log(videoInfo.height)
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

  /* for (let i = 0; i < items.lastFrame; i++) {
    renderer.render(i, items.layers);
    const frame = new VideoFrame(offscreen, { timestamp: i * (1_000_000 / videoInfo.fps) }); // マイクロ秒なので1_000_000倍
    encoder.encode(frame);
    //frame.close();
    setTimeout(() => frame.close(), 0);
  };
  const frameQueue: VideoFrame[] = [];

  for (let i = 0; i < items.lastFrame; i++) {
    renderer.render(i, items.layers);

    const frame = new VideoFrame(offscreen, {
      timestamp: i * (1_000_000 / videoInfo.fps),
    });

    encoder.encode(frame);
    frameQueue.push(frame);

    // 古いフレームを非同期に破棄（キューが一定以上たまったら）
    if (frameQueue.length > 5) {
      const old = frameQueue.shift();
      if (old) {
        setTimeout(() => old.close(), 0); // 遅延closeでGPU負荷を分散
      }
    }
  }

  // 残っているフレームもすべて遅延してclose
  frameQueue.forEach(f => setTimeout(() => f.close(), 0));


  await encoder.flush().then(() => {
    encoder.close();
    console.log('VideoEncoderはflush、closeが完了しました');
  });
}

const encodeAudio = async () => {
  if ("AudioEncoder" in window) {
    console.log("AudioEncoder available. Using WebCodecs.");

    const audioPlayer = new AudioPlayer();
    const audioBuffer = await audioPlayer.record(); // AudioBuffer

    await encodeAudioWithAudioEncoder(audioBuffer);
  } else {
    console.log("AudioEncoder unavailable. Using MediaRecorder fallback.");

    await encodeAudioWithMediaRecorder();
  }
}

const encodeAudioWithAudioEncoder = async (audioBuffer: AudioBuffer) => {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;

  const init: AudioEncoderInit = {
    output: handleAudioChunk,
    error: (e) => console.error("AudioEncoder error:", e),
  };

  const encoder = new AudioEncoder(init);
  encoder.configure({
    codec: "aac", // MP4互換なら 'aac' だが非対応のことがある
    numberOfChannels,
    sampleRate,
    bitrate: 128_000,
  });

  const frameCount = audioBuffer.length;
  const buffer = new Float32Array(frameCount * numberOfChannels);

  // interleave channels
  for (let i = 0; i < frameCount; i++) {
    for (let ch = 0; ch < numberOfChannels; ch++) {
      buffer[i * numberOfChannels + ch] = audioBuffer.getChannelData(ch)[i];
    }
  }

  const audioData = new AudioData({
    format: "f32",
    sampleRate,
    numberOfFrames: frameCount,
    numberOfChannels,
    timestamp: 0,
    data: buffer,
  });

  encoder.encode(audioData);
  await encoder.flush().then(() => {
    console.log('AudioEncoder flush completed');
    encoder.close();
  });
};
const encodeAudioWithMediaRecorder = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const recorder = new MediaRecorder(stream, {
          mimeType: "audio/webm" // もしくは 'audio/webm;codecs=opus'
        });

        const chunks: Blob[] = [];

        recorder.ondataavailable = e => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: "audio/webm" });
          const reader = new FileReader();
          reader.onloadend = () => {
            const buffer = new Uint8Array(reader.result as ArrayBuffer);
            audioChunks.push(buffer);
            resolve();
          };
          reader.readAsArrayBuffer(blob);
        };

        recorder.onerror = reject;

        recorder.start();
        setTimeout(() => {
          recorder.stop();
          stream.getTracks().forEach(t => t.stop());
        }, 5000); // 録音時間 (例: 5秒)
      })
      .catch(reject);
  });
};


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
  muxer.on('error', (error) => {
    console.error("Muxing error:", error);
  });
  muxer.on('data', (segment) => {
    console.log("MP4 segment created, size:", segment.data.byteLength);
    const blob = new Blob([segment.data], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'output.mp4';
    a.click();

    URL.revokeObjectURL(url);
  });
  
  videoChunks.forEach((chunk) => muxer.push(chunk));
  audioChunks.forEach((chunk) => muxer.push(chunk));


  muxer.flush();
  console.log("flushed")
} */