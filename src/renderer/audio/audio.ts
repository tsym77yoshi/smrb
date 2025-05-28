import type { AudioItem, VideoItem, AudioEffect, VoiceItem, TLItem, ItemType, VarNumbers } from "@/types/itemType";
import { isAudioItem } from "@/types/itemType";
import { useItemsStore, useStateStore, useVideoInfoStore } from "@/store/tlStore";
import { useFileStore } from "@/store/fileStore";
import { animation } from "@/data/animationCurve";

type AudioItemsType = AudioItem | VideoItem | VoiceItem;

export class AudioPlayer {
  #fileStore: ReturnType<typeof useFileStore>;
  #videoInfo: ReturnType<typeof useVideoInfoStore>;
  #state: ReturnType<typeof useStateStore>;
  #items: ReturnType<typeof useItemsStore>;
  #audioContext: AudioContext | OfflineAudioContext | null = null;
  
  #renderId: number;
  #playStartFrame: number;

  constructor() {
    this.#fileStore = useFileStore();
    this.#videoInfo = useVideoInfoStore();
    this.#state = useStateStore();
    this.#items = useItemsStore();
    this.#renderId = -1;
    this.#playStartFrame = 0;
  }

  play = (): void => {
    const stFrame = this.#state.frame;
    this.#audioContext = new AudioContext();
    this.#mix(stFrame, this.#audioContext);
  }
  terminate = (): void =>{
    console.log("audio terminated");
    this.#renderId++;
    if(this.#audioContext == null) {
      console.warn("AudioContext is not initialized.");
      return;
    }
    if(this.#audioContext instanceof AudioContext) {
      this.#audioContext.close();//close();
    }
  }
  record = async (): Promise<AudioBuffer> => {
    const sampleRate = this.#videoInfo.hz;
    const length = sampleRate * this.#items.lastFrame / this.#videoInfo.fps;
    const offlineAudioContext = new OfflineAudioContext(2, length, sampleRate);
    this.#mix(0, offlineAudioContext);
    return await offlineAudioContext.startRendering();
  }
  #mix = (stFrame: number, audioContext: AudioContext | OfflineAudioContext) => {
    //this.#renderId = this.#renderId;
    const audioItems = this.#filterAudioItems(this.#items.items);
    const activeItems = this.#filterItemsByIsActive(audioItems);
    const filteredItems = this.#filterItemsByFrame(activeItems, stFrame);
    const sortedItems = this.#sortItemsByStFrame(filteredItems);

    this.#playStartFrame = stFrame;

    (sortedItems as AudioItemsType[]).forEach(item => {
      const fileId = this.#getAudioFileId(item);
      const [file, status] = this.#fileStore.get(fileId);
      console.log(status)
      // ファイルが未読み込みだった時に実行
      if (status === "unload") {
        this.#fileStore.startLoadFileById(fileId);
      }
      if (status === "unload" || status === "loading") {
        this.#fileStore.addOnReadFileFunc(fileId, () => {
          const [loadedFile, status] = this.#fileStore.get(fileId);
          if (loadedFile == undefined) {
            console.error("File not found:", fileId, item.type, item.frame, item.length);
            return;
          }
          if (this.#renderId !== this.#renderId) {
            return;
          }
          console.log("loaded")
          this.#mixOne(item, audioContext, loadedFile.file as AudioBuffer);  
        });
      } else if (status === "loaded") {
        if (file == undefined) {
          console.error("File not found:", fileId, item.type, item.frame, item.length);
          return;
        }
        this.#mixOne(item, audioContext, file.file as AudioBuffer);
      }
    })
  }

  #mixOne = (item: AudioItemsType, audioContext: AudioContext | OfflineAudioContext, audioBuffer: AudioBuffer) => {
    const destination = audioContext.destination;
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(destination);
    // エフェクト
    const audioEffects = item.audioEffects;
    // pan, volume, playbackRate, isLoop, fadeIn, fadeOut

    const fps = this.#videoInfo.fps;
    const duration = function () {
      switch (item.type) {
        case "audio":
        case "video":
          return (item as AudioItem | VideoItem).length / fps;
        case "voice":
          return (item as VoiceItem).voiceLength;
      }
    }();

    // ノード作成
    source.loop = item.type === "voice" || item.isLooped;
    source.playbackRate.value = item.playbackRate / 100;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0; // 最初は 0 でフェードイン用

    const panner = audioContext.createStereoPanner();
    panner.pan.value = 0////////////item.pan;
    const [fadeIn, fadeOut] = function () {
      switch (item.type) {
        case "audio":
        case "video":
          return [(item as AudioItem | VideoItem).fadeIn, (item as AudioItem | VideoItem).fadeOut];
        case "voice":
          return [(item as VoiceItem).voiceFadeIn, (item as VoiceItem).voiceFadeOut];
        default:
          console.error("Unknown item type:", item.type);
          return [0, 0];
      }
    }();

    // 接続
    source.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(destination);

    const now = audioContext.currentTime;
    let stSec = (item.frame - this.#playStartFrame) / this.#videoInfo.fps;
    let contentOffset = item.contentOffset || 0;
    if(stSec < 0) {
      contentOffset -= stSec; // オフセットを調整
      stSec = 0; // 開始時間を0に調整
      if(stSec < now) {
        contentOffset += now;
        stSec = now;
      }
    }
    source.start(stSec, contentOffset, duration);

    // フェードイン
    gainNode.gain.setValueAtTime(0, stSec);
    gainNode.gain.linearRampToValueAtTime(1, stSec + fadeIn);/////////

    // フェードアウト設定（durationが指定されているとき）
    if (duration && fadeOut > 0) {
      const fadeOutStart = stSec + duration - fadeOut;
      gainNode.gain.setValueAtTime(1, fadeOutStart);///////
      gainNode.gain.linearRampToValueAtTime(0, fadeOutStart + fadeOut);
    }
  }

  #filterAudioItems = (items: TLItem[]): TLItem[] => {
    return items.filter(item => isAudioItem(item.type))
  }

  #filterItemsByFrame = (items: TLItem[], stFrame: number): TLItem[] => {
    if (stFrame <= 0) {
      return items;
    }
    return items.filter(item => item.frame + item.length > stFrame);
  }

  #sortItemsByStFrame = (items: TLItem[]) => {
    return items.sort((a, b) => {
      return a.frame - b.frame
    });
  }

  #filterItemsByIsActive = (items: TLItem[]) => {
    return items.filter(item => !item.isHidden)// レイヤーのアクティブ状態は後で
  }

  #getAudioFileId = (item: AudioItemsType): number => {
    switch (item.type) {
      case "audio":
      case "video":
        return (item as AudioItem | VideoItem).fileId;
      case "voice":
        return (item as VoiceItem).voiceId;
      default:
        console.error("Unknown item type:", item.type);
        return -1;
    }
  }

  #easingToLinear = (varNum: VarNumbers, item: TLItem, stFrame: number) => {


    return animation(varNum, stFrame, item.keyFrames, item.length, this.#videoInfo.fps);
  }
}


function audioBufferToWav(buffer: AudioBuffer):Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);
  // ... WAV header 書き込み（省略）
  return new Blob([view], { type: 'audio/wav' });
}
const downloadBuffer = (buffer: AudioBuffer): void => { 
  const wavBlob = audioBufferToWav(buffer);
  const url = URL.createObjectURL(wavBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'offline.wav';
  link.textContent = 'Download offline render';
  document.body.appendChild(link);
}