import type { AudioItem, VideoItem, AudioEffect, VoiceItem, TLItem, ItemType, VarNumbers } from "@/types/itemType";
import { isAudioItem } from "@/types/itemType";
import { useItemsStore, useStateStore, useVideoInfoStore } from "@/store/tlStore";
import { useFileStore } from "@/store/fileStore";
import { animation, linearRamp } from "@/data/animationCurve";

type AudioItemsType = AudioItem | VideoItem | VoiceItem;

export class AudioPlayer {
  #fileStore: ReturnType<typeof useFileStore>;
  #videoInfo: ReturnType<typeof useVideoInfoStore>;
  #state: ReturnType<typeof useStateStore>;
  #items: ReturnType<typeof useItemsStore>;
  #audioContext: AudioContext | OfflineAudioContext | null = null;
  
  #renderId: number;
  #playStartFrame: number;
  #loadWaitingFileIds: number[] = [];

  constructor() {
    this.#fileStore = useFileStore();
    this.#videoInfo = useVideoInfoStore();
    this.#state = useStateStore();
    this.#items = useItemsStore();
    this.#renderId = 0;
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
    this.#loadWaitingFileIds = [];
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
    while (this.#loadWaitingFileIds.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return await offlineAudioContext.startRendering();
  }
  #mix = (stFrame: number, audioContext: AudioContext | OfflineAudioContext) => {
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
        this.#loadWaitingFileIds.push(fileId);
        
        // 読み込みが終わったら実行する関数を登録
        this.#fileStore.addOnReadFileFunc(fileId, () => {
          const [loadedFile, status] = this.#fileStore.get(fileId);
          if (loadedFile == undefined) {
            console.error("File not found:", fileId, item.type, item.frame, item.length);
            return;
          }
          if (this.#renderId !== this.#renderId) {
            return;
          }
          console.log("loaded");
          this.#loadWaitingFileIds = this.#loadWaitingFileIds.filter(id => id !== fileId);
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

    const now = audioContext.currentTime;
    const stSec = (item.frame - this.#playStartFrame) / this.#videoInfo.fps;
    
    
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
    source.loop = (item.type != "voice") && item.isLooped;
    source.playbackRate.value = item.playbackRate / 100;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0; // 最初は 0 でフェードイン用

    const panner = audioContext.createStereoPanner();
    if (item.pan) {
      this.#setEasingToAudioParam(panner.pan, item.pan, item.frame, item, (x: number) => {
        return x / 100; // パンは -1.0 から 1.0 の範囲
      });
    }
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

    let stSecCut = stSec;
    let contentOffset = item.contentOffset || 0;
    if(stSecCut < 0) {
      contentOffset -= stSecCut; // オフセットを調整
      stSecCut = 0; // 開始時間を0に調整
      if(stSecCut < now) {
        contentOffset += now;
        stSecCut = now;
      }
    }
    source.start(stSecCut, contentOffset, duration);

    // フェードイン
    this.#setLinearAudioParam(gainNode.gain, stSec, stSec + fadeIn, 0, 1);

    // フェードアウト設定（durationが指定されているとき）
    if (duration && fadeOut > 0) {
      const fadeOutStart = stSec + duration - fadeOut;
      this.#setLinearAudioParam(gainNode.gain, fadeOutStart, fadeOutStart + fadeOut, 1, 0);
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

  #setEasingToAudioParam = (param: AudioParam, varNum: VarNumbers, stTime_s: number, item: AudioItemsType, valTreat: (x:number) => number) => {
    linearRamp(varNum, item.keyFrames, item.length, this.#videoInfo.fps).forEach((ramp) => {
      const startTime = ramp.stFrame / this.#videoInfo.fps + stTime_s;
      const endTime = ramp.edFrame / this.#videoInfo.fps + stTime_s;
      const stVal = valTreat(ramp.stVal);
      const edVal = valTreat(ramp.edVal);
      this.#setLinearAudioParam(param, startTime, endTime, stVal, edVal);
    })
  }

  #setLinearAudioParam = (param: AudioParam, startTime: number, endTime: number, stVal: number, edVal: number) => {
    if (endTime < 0) return; // 開始時間より前の値は無視
      if (startTime < 0) {
        // 開始時間が0より前の場合、内分をとる
        startTime = 0;
        stVal = (stVal * (endTime - 0) + edVal * (0 - startTime)) / (endTime - startTime);
      }
      param.setValueAtTime(stVal, startTime);
      param.linearRampToValueAtTime(edVal, endTime);
  }
}