<template>
  <q-footer style="display: flex;">
    <FootToolButton label="元に戻す" icon="undo" @click="log.undo" />
    <FootToolButton label="やり直す" icon="redo" @click="log.redo" />
    <FootToolButton label="ｱｲﾃﾑ分割" icon="content_cut" @click="contentCut" />
    <FootToolButton label="ｱｲﾃﾑ削除" icon="delete" @click="contentRemove" />
    <FootToolButton :label="state.isPlaying ? '再生停止' : '再生開始'" icon="play_circle" @click="play" />
    <FootToolButton label="設定全般" icon="settings" @click="goToSetting" />
  </q-footer>
</template>

<script setup lang="ts">
import FootToolButton from "./FootToolButton.vue";
import type { LogAdd, LogProperty } from "@/type/logType";
import type { Item, AudioItem, VarNumbers, ItemProperty } from "@/type/itemType";
import { isAudioItem, itemPropertyGroups, getAnimationValuesType } from "@/type/itemType";
import { useItemsStore, useSelectionStore, useStateStore, useLogStore, useVideoInfoStore } from "@/store/tlStore";
import { animation } from "@/data/animationCurve";
import { useRouter } from "vue-router";
import { ReusableAudioPlayer } from "./playAudio";
import { useFileStore } from "@/store/fileStore";

const items = useItemsStore();
const selections = useSelectionStore();
const state = useStateStore();
const videoInfo = useVideoInfoStore();
const filestore = useFileStore();
const log = useLogStore();
const router = useRouter();

// ｱｲﾃﾑ分割
const contentCut = () => {
  const targetItems = items.items.filter(
    (item) =>
      selections.selections.includes(item.id)
  )
  let propertyLogs: LogProperty[] = []
  let addLogs: LogAdd[] = []
  for (const item of targetItems) {
    const itemFrame = state.frame - item.frame
    // ==は切った後のアイテムの長さが0になるのでダメ
    if (1 < itemFrame && itemFrame < item.length) {
      const newItem = JSON.parse(JSON.stringify(item)) as Item;
      const oldItem = JSON.parse(JSON.stringify(item)) as Item;

      // 前のアイテムの処理
      /// 長さ
      const cutLog = items.overwrite([item.id], "length", [item.length], itemFrame, true);
      propertyLogs.push(cutLog);
      /// キーフレーム
      const formerKeyFrames = {
        frames: item.keyFrames.frames.filter(keyFrame => keyFrame < itemFrame),// 注:イコールは含まない
        count: item.keyFrames.frames.filter(keyFrame => keyFrame < itemFrame).length
      }
      const keyFrameCutLog = items.overwrite([item.id], "keyFrames", [item.keyFrames], formerKeyFrames, true);
      propertyLogs.push(keyFrameCutLog);


      // 後ろのアイテムの処理
      newItem.id = undefined;// addの方で自動追加されるようになっている
      newItem.frame = state.frame;
      /// 長さ
      newItem.length -= itemFrame;
      /// キーフレーム
      newItem.keyFrames = {
        frames: item.keyFrames.frames.filter(keyFrame => keyFrame > itemFrame).map(keyFrame => keyFrame - itemFrame),
        count: item.keyFrames.frames.filter(keyFrame => keyFrame > itemFrame).length
      };
      getKeyFramesKeys(newItem);
      /// 再生位置
      if (isAudioItem(newItem.type)) {
        (newItem as AudioItem).contentOffset += itemFrame / videoInfo.fps;// 秒
      }


      // 前後アイテム併せてのVarNumbersのvaluesの更新
      const keyFramesKeys = getKeyFramesKeys(item);
      for (const key of keyFramesKeys) {
        let newVarNumVal = JSON.parse(JSON.stringify(item[key])) as VarNumbers;
        // キーフレームとカットするフレームが被っていなかったら追加（だからイコールを入れてないなかったんですね）
        if (!oldItem.keyFrames.frames.includes(itemFrame)) {
          // @ts-ignore
          const newAnimationValue = animation(item[key] as VarNumbers, itemFrame, oldItem.keyFrames, oldItem.length, videoInfo.fps)
          newVarNumVal.values.push({
            value:newAnimationValue,
          });
          // 並べ替え
          newVarNumVal.values.sort((a, b) => a.value - b.value);
        }
        const formerNumValues = newVarNumVal.values.slice(0, formerKeyFrames.frames.length + 2);
        const latterNumValues = newVarNumVal.values.slice(-(newItem.keyFrames.frames.length + 2));

        const keyFrameCutLog = items.overwrite([item.id], key, [item[key]], {
          values: formerNumValues,
          span: newVarNumVal.span,
          animationType: newVarNumVal.animationType,
        }, true);
        propertyLogs.push(keyFrameCutLog);
        // @ts-ignore
        (newItem[key] as VarNumbers).values = latterNumValues;
      }

      // 後ろを追加
      const addLog = items.add([newItem])
      addLogs.push(addLog)
    }
  }
  log.add([...propertyLogs, ...addLogs])
  selections.select(addLogs.map(addLog => addLog.itemIds[0]))// addするのは一個ずつなのでこれでよい
}
const getKeyFramesKeys = (item: Item): (keyof Item)[] => {
  // itemのtypeでpropertyTypeがVarNumbersのもののkey一覧を取得
  const varNumPropertieKeys = Object.entries(itemPropertyGroups[item.type]
    .map(group => group.properties) // 各グループの properties を取得
    .flat() // 配列をフラット化
    .reduce((acc, props) => ({ ...acc, ...props }), {})) // 各 properties オブジェクトを結合
    .filter(([key, value]) => (value as ItemProperty).propertyType === "VarNumbers") // propertyType が "VarNumbers" のみ抽出
    .map(([key, value]) => key); // 必要に応じて整形

  // animationType が keyFrames のものを抽出
  return varNumPropertieKeys.filter((targetPropertieKey) => {
    const itemVal = item[targetPropertieKey as keyof Item];
    if (typeof itemVal != undefined) {
      // @ts-ignore
      if (getAnimationValuesType((itemVal as VarNumbers).animationType) == "keyFrames") {
        return true;
      }
      return false;
    }
    else return false;
  }) as (keyof Item)[];
}

// ｱｲﾃﾑ削除
const contentRemove = () => {
  const removeLog = items.remove(selections.selections);
  log.add([removeLog]);
}

// 再生開始及び停止
const play = () => {
  if (state.isPlaying) {
    /// 停止
    state.isPlaying = false;
    playId++;
    audioPlayStop();
  } else {
    /// 開始
    state.isPlaying = true;
    stFrame = state.frame;

    start = undefined;
    step(performance.now());

    // 音声
    playId++;
    audiosPlayStart();// startの設定後である必要あり
  }
}

/// 再生の処理
let start: number | undefined;
let previousTimeStamp: number;
let stFrame = 0;// [フレーム]
let elapsed = 0;// [ミリ秒] 音声の方でも使う
// (動画の方)state.frameを更新する
const step = (timestamp: number) => {
  if (start === undefined) {
    start = timestamp;
  }
  elapsed = timestamp - start;
  const frame = Math.round(videoInfo.fps * elapsed / 1000) + stFrame;

  if (previousTimeStamp !== timestamp) {
    state.setFrame(frame);
  }

  // 終了しない
  if (state.isPlaying == true) {
    if (frame <= items.lastFrame) {
      previousTimeStamp = timestamp;
      window.requestAnimationFrame(step);
    } else {
      state.isPlaying = false;
      state.setFrame(items.lastFrame);
      playId++;
      audioPlayStop();
    }
  }
}
// (音声の方)音声を再生する
type AudioCache = {
  player: ReusableAudioPlayer;
  itemId: number;
  playId: number;
}
let audioCaches: AudioCache[] = [];
let playId = 0;// 再生毎にid
const audiosPlayStart = () => {
  for (const item of items.items) {
    if (isAudioItem(item.type)) {
      const cache = audioCaches.find(cache => cache.itemId == item.id)
      if (cache == undefined) {
        // cache無し
        const newAudio = new ReusableAudioPlayer();
        const audioCache: AudioCache = {
          player: newAudio,
          itemId: item.id,
          playId: playId,
        }
        audioCaches.push(audioCache);
        audioLoad((item as AudioItem).fileId, audioCache);

      } else if (!cache.player.isLoaded) {
        // 未読み込みのcacheあり
        cache.playId = playId;// playId更新

      } else {
        // cache有り読み込み有り
        cache.playId = playId;// playId更新
        audioPlaySet(cache)

      }
    }
  }
}
const audioPlayStop = () => {
  for (const audioCache of audioCaches) {
    audioCache.player.stop();
  }
}
const audioLoad = async (fileId: number, audioCache: AudioCache) => {
  const audioBlob = await filestore.getBlob(fileId);
  if (audioBlob == undefined) {
    console.error("音声の読み込みに失敗")
    return;
  }
  await audioCache.player.loadAudio(audioBlob)
  audioPlaySet(audioCache)// audioCache内のplayIdが他で書き換えられるかも
}
const audioPlaySet = (audioCache: AudioCache) => {
  // playIdが一致しなければやめる
  if (audioCache.playId != playId) {
    return;
  }

  const targetItem = items.items.find(item => item.id == audioCache.itemId);
  if (targetItem == undefined) {
    console.error("アイテムが見つかりませんでした");
    return;
  }

  // 今動画でいうところのどこか？
  const nowPlayTime = elapsed + stFrame * 1000 / videoInfo.fps; // [ミリ秒]

  // スタートまでの秒数
  const waitTime = targetItem.frame * 1000 / videoInfo.fps - nowPlayTime;// [ミリ秒]

  // 現在の時刻が再生終了予定より後
  if (waitTime + targetItem.length * 1000 / videoInfo.fps < 0) {
    return;
  }

  // 現在の時刻が再生開始予定より前
  if (waitTime > 0) {
    setTimeout(() => { audioCache.player.play() }, waitTime)
    return;
  }

  // 現在の時刻が再生開始予定と終了予定の間
  audioCache.player.play(- waitTime / 1000)
}

const goToSetting = () => {
  router.push({ name: "setting" });
}

</script>
