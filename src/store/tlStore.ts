import { ref, computed, watchEffect } from 'vue'
import { defineStore } from 'pinia'
import type { HideLevel, Item, TLItem, ItemKey } from '@/type/itemType'
import type { Log, LogAdd, LogRemove, LogProperty } from '@/type/logType'
import { isValidItemPos } from '@/composables/item'


export const useSettingStore = defineStore('setting', () => {
  const showHideLevels = ref<HideLevel[]>(["advanced"]);
  // 素材にアクセスするのに、こういったリンクが近くにあると使いやすいと思って
  const fileViewExternalLinks = ref<{ name: string; link: string }[]>([
    { name: "ニコニコモンズ", link: "https://commons.nicovideo.jp/" },
    { name: "ニコニコ静画", link: "https://sp.seiga.nicovideo.jp/illust" },
    { name: "効果音ラボ", link: "https://soundeffect-lab.info/sound/anime/" },
  ])
  return { showHideLevels, fileViewExternalLinks }
}, {
  persist: {
    key: "setting",
    storage: localStorage,
  }
})

export const useItemsStore = defineStore('item', () => {
  const storeItems = ref<TLItem[]>([]);
  const viewItems = ref<TLItem[]>([]);// diffwriteとoverwriteで書き換え中の時にも値を変えるitems
  watchEffect(() => {
    viewItems.value = storeItems.value.map((tlItem) => { return { ...tlItem } })
  })
  const items = computed(() => viewItems.value)
  const layers = computed(() => {
    let itemLayers: TLItem[][] = [[], [], [], [], [], [], [], [], [], []];// 画面表示を守るために
    // レイヤーへ追加
    for (const item of viewItems.value) {
      //for (const item of items) {
      while (itemLayers.length <= item.layer) {
        itemLayers.push([]);
      }
      itemLayers[item.layer].push(item);
    }
    // レイヤー内並び替え
    for (const layer of itemLayers) {
      layer.sort((a, b) => {
        return a.frame - b.frame
      })
    }
    // 画面表示を守るために2
    for (let i = 0; i < 5; i++) {
      itemLayers.push([]);
    }
    return itemLayers;
  });

  const selection = useSelectionStore();

  let idCounter = 0;// 固有idを割り振る
  const idInitialize = () => {
    idCounter = storeItems.value.length > 0 ? Math.max(...storeItems.value.map((item) => item.id)) + 1 : 0;
  }
  const add = (addItems: Item[]): LogAdd => {
    let addIds = []
    for (const item of addItems) {
      if (!("id" in item) || item?.id == undefined) {
        item.id = idCounter;
        idCounter++;
      }

      //storeItems.push(item as TLItem);
      storeItems.value.push(item as TLItem);
      for (let i = item.layer; ; i++) {
        item.layer = i;
        //if (isValidItemPos(items)) {
        if (isValidItemPos(storeItems.value)) {
          break;
        }
      }
      addIds.push(item.id)
    }
    selection.reset();
    return {
      type: "add",
      itemIds: addIds,
    }
  }
  const remove = (itemIds: number[]): LogRemove => {
    const removeItemIds = storeItems.value
      .map((item, index) => { return { id: item.id, index: index } })
      .filter((numSet) => itemIds.includes(numSet.id))
      .map((numSet) => numSet.index);

    let removeItems: TLItem[] = []
    // 後ろから順に削除
    removeItemIds.sort((a, b) => { return b - a })
    for (const removeItemId of removeItemIds) {
      const removeItem = storeItems.value.splice(removeItemId, 1);
      removeItems.push(removeItem[0]);
    }
    const removeItemsClones = JSON.parse(JSON.stringify(removeItems));
    return {
      type: "remove",
      items: removeItemsClones,
    }
  }
  // 整数値前提
  const diffwrite = (itemIds: number[], keyName: keyof TLItem, pastValues: number[], diffValue: number, isSet: boolean): LogProperty => {
    for (let delta = Math.round(diffValue); ; delta > 0 ? delta-- : delta++) {
      for (let i = 0; i < itemIds.length; i++) {
        //const item = storeItems.find((item) => item.id == itemIds[i])
        const item = (isSet ? storeItems : viewItems).value.find((item) => item.id == itemIds[i])
        if (item != undefined) {
          //@ts-ignore
          item[keyName] = pastValues[i] + delta;
        }
      }
      //if (isValidItemPos(storeItems)) {
      if (isValidItemPos((isSet ? storeItems : viewItems).value)) {
        break;
      }
      if (delta == 0) {
        break;
      }
    }
    return {
      type: "property",
      itemIds: itemIds,
      keyName: keyName,
      pastValues: pastValues,
    }
  }
  const overwrite = (itemIds: number[], keyName: ItemKey, pastValues: unknown[], newValue: unknown, isSet: boolean): LogProperty => {
    (isSet ? storeItems : viewItems)
      .value
      .filter((tlItem: TLItem) => itemIds.includes(tlItem.id))
      .map((tlItem) => {
        // めんどいから消したのであって将来修正した方が絶対いい
        //@ts-ignore
        tlItem[keyName] = newValue;
      });
    return {
      type: "property",
      itemIds: itemIds,
      keyName: keyName,
      pastValues: pastValues,
    }
  }

  const lastFrame = computed(() =>
    Math.max(
      Math.max(...layers.value.map((layer) =>
        Math.max(...layer.map((item) => item.frame + item.length)))),
      0)
  )

  return { items/* 読み取り専用 */, layers, add, remove, diffwrite, overwrite, idInitialize, lastFrame, storeItems/**store--にはアクセスしないで！persist用だから！ */ }
}, {
  persist: {
    storage: localStorage,
    pick: ["storeItems"],
  }
});

export const useStateStore = defineStore('state', () => {
  type UserModeType = "normal" | "select";

  const frame = ref(0);// 操作しているフレーム
  const ppf = ref(1);// pixel per frame。タイムライン上で1フレームを何ピクセルの長さで表すか
  const viewWidth = ref(2000)// px, timelineの長さ(row部分含まず)
  const userMode = ref<UserModeType>("normal");
  const isPlaying = ref<Boolean>(false);

  const skipRate = 30;

  function setFrame(setNumber: number) {
    frame.value = setNumber;
  }
  function skip(direction: number) {
    frame.value += direction * skipRate;
  }
  function resetFrame() {
    frame.value = 0;
  }

  return { frame, ppf, viewWidth, userMode, setFrame, skip, resetFrame, isPlaying }
});

export const touchStore = defineStore('touch', () => {
  const activeTouches = ref(new Set());
  const countDown = computed((): number => {
    // pointerdownの判定は、子オブジェクト->親オブジェクトという順になるので、down時に子オブジェクトで取得するときに便利にするために+1している
    return activeTouches.value.size + 1;
    // return touchNumber + 1;
  });
  let touchNumber = 0;
  const setTouchNumber = (touchNum: number) => {
    touchNumber = touchNum;
  }
  type touchTargetType =
    | ""
    | "itemEdgeLeft"
    | "itemEdgeRight"
    | "unselectedItem"
    | "selectedItem"
    | "back";
  type TouchModeType = "" | "wait" | "idou" | "long" | "wait2";
  const target = ref<touchTargetType>("");
  const mode = ref<TouchModeType>("");
  const timeoutId = ref<undefined | number>(undefined);
  const WAIT_TIME = ref<number>(512); // 長押しと判定されるまでの時間。ms

  return { activeTouches, countDown, target, mode, timeoutId, WAIT_TIME, setTouchNumber }
});

export const useSelectionStore = defineStore('selections', () => {
  const storeSelections = ref<number[]>([]);// itemsのindexの配列
  const selections = computed(() => storeSelections.value)

  function select(ids: number[]) {
    reset();
    storeSelections.value.push(...ids);
  }
  function selectAdd(id: number) {
    if (!selections.value.includes(id)) {
      storeSelections.value.push(id);
    }
  }
  function selectRemove(id: number) {
    if (selections.value.includes(id)) {
      storeSelections.value = storeSelections.value.filter(value => value != id);
    }
  }
  function reset() {
    storeSelections.value = [];
  }
  return { selections/* 読み取り専用 */, select, selectAdd, selectRemove, reset }
});

export const useLogStore = defineStore('log', () => {
  // 一つの動作でLog[] (ex: 「Itemを移動させる」でlayerとstartとendを変更)なので[][]が正しい
  const logs = ref<Log[][]>([]);
  const add = (addLogs: Log[]) => {
    logs.value.push(addLogs);
    console.log(addLogs)
    undoLogs.value = [];
  }
  const undoLogs = ref<Log[][]>([]);
  const undo = () => {
    const undoLog = logs.value.pop()
    console.log(undoLog)
    if (undoLog == undefined) {
      return;
    }
    const logForRedo = actionFromLog(undoLog)
    undoLogs.value.push(logForRedo)
  }
  const redo = () => {
    const redoLog = undoLogs.value.pop()
    console.log(redoLog)
    if (redoLog == undefined) {
      return;
    }
    const logForUndo = actionFromLog(redoLog)
    logs.value.push(logForUndo)
  }
  const items = useItemsStore();
  const actionFromLog = (actionLog: Log[]): Log[] => {
    let actionLogs = []
    for (const log of actionLog) {
      if (log.type == "add") {
        const actionLog = items.remove(log.itemIds);
        actionLogs.push(actionLog)
      }
      else if (log.type == "remove") {
        const actionLog = items.add(log.items)
        actionLogs.push(actionLog)
      }
      else if (log.type == "property") {
        // 元の値は様々なので一個ずつ処理
        for (let i = 0; i < log.itemIds.length; i++) {
          const nowTarget = items.items.find(item => item.id == log.itemIds[i])
          const nowValue = nowTarget ? nowTarget[log.keyName] : undefined
          if (nowValue == undefined) {
            console.error("やばい！")
          }
          const actionLog = items.overwrite([log.itemIds[i]], log.keyName, [nowValue], log.pastValues[i], true)
          console.log(actionLog)
          actionLogs.push(actionLog)
        }
      }
    }
    return actionLogs;
  }
  return { add, undo, redo }
});

export const useVideoInfoStore = defineStore('videoInfo', () => {
  const fps = ref(30.0);
  const width = ref(1280);
  const height = ref(720);
  const hz = ref(48000);

  return { fps, width, height, hz }
}, {
  persist: {
    storage: localStorage,
  }
});