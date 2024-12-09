<!-- もともとスクロールはデフォルトで書いていたのだけれどtouch-actionをnoneにするのと開始のタイミングがずれることでこんなコードに -->

<template>
  <div style="overflow: hidden; position: relative;height:100%" class="unselectable">
    <div ref="contentX" class="x-scrollable" style="touch-action: none;overflow-x: scroll;overflow-y: hidden;"
      @pointerdown="backTouchStart" @pointermove="backTouchMove" @pointerup="backTouchEnd"
      @pointerleave="backTouchCancel" @pointercancel="backTouchCancel" @scroll="setFrameView" @scrollend="setFrame">
      <div class="x-container" :style="{ width: state.viewWidth + 'px' }" ref="pointerPosXRef">
        <!-- タイムラインヘッド -->
        <TimelineHead />

        <!-- タイムライン -->
        <div class="y-scrollable" style="touch-action: none;overflow-y: scroll;overflow-x: hidden;" ref="contentY">
          <div class="y-container" ref="pointerPosYRef">

            <div v-for="(itemLayer, index) in viewItemLayers" :key="index">
              <!-- １レイヤー -->
              <div class="layer">
                <!-- レイヤー表記 -->
                <div class="timeline-row" style="font-size: 1.5rem">
                  {{ 10 > index ? "0" + index : index }}ﾚｲﾔｰ</div>
                <!-- １レイヤー内のアイテム -->
                <div style="position: relative">
                  <TLItemComponent v-for="(item, i) in itemLayer" :item="item" :color="getItemColor(item)" :key="i"
                    :isSelected="selections.selections.includes(item.id)" :onEdgePointDown="itemEdgeTouchDown"
                    @pointerdown.prevent="itemTouchStart($event, item.id)" @pointermove.prevent="itemEnter(item.id)" />
                </div>
              </div>

              <!-- 区切り線 -->
              <div class="horizontal-line"></div>
            </div>
            <!-- 再生位置バー -->
            <div class="play-bar">
              <div class="play-bar-icon">
                {{ viewTime }}秒({{ viewFrame }}ﾌﾚｰﾑ)
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
    <TimelineItemPropertyDialog ref="itemPropertyDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watchEffect, watch } from "vue";
import TimelineHead from "../Timeline/TimelineHead.vue";
import TLItemComponent from "./TLItem.vue";
import TimelineItemPropertyDialog from "./TimelineItemPropertyDialog.vue";
import {
  useItemsStore,
  useStateStore,
  touchStore,
  useSelectionStore,
  useVideoInfoStore,
  useLogStore,
} from "@/store/tlStore";
import { getItemColor } from "@/components/TLItem/getItemColor";
import type { LogProperty } from "@/type/logType";


// タイムラインバーの位置
const scroll = ref<Position>({ x: 0, y: 0, });
watch(scroll, () => {
  contentX.value.scrollLeft = scroll.value.x
  contentY.value.scrollTop = scroll.value.y
})
let scrollSt: Position = { x: 0, y: 0, };
const state = useStateStore();
const videoInfo = useVideoInfoStore();
const viewFrame = ref(state.frame);
const viewTime = computed(() => {
  return Math.round(viewFrame.value / videoInfo.fps);
});
const setFrameView = (event: any) => {
  if (event) {
    viewFrame.value = Math.trunc(event.target?.scrollLeft / state.ppf);
  }
};
const setFrame = () => {
  state.setFrame(viewFrame.value);
};

// はじめにスクロール位置を調整
const contentX = ref(); // <template>側にref="content"があります！
onMounted(() => {
  contentX.value.scrollLeft = viewFrame.value * state.ppf;
});
watchEffect(() => {
  if (state.isPlaying) {
    viewFrame.value = state.frame;
    if (contentX.value) {
      contentX.value.scrollLeft = viewFrame.value * state.ppf;
    }
  }
})
const contentY = ref()

// アイテム
const items = useItemsStore();
const viewItemLayers = computed(() => items.layers);
const selections = useSelectionStore();

const itemPropertyDialog = ref();//template内に対象があります
const itemPropertyDialogShow = () => {
  itemPropertyDialog.value?.show();
}

const log = useLogStore();
let originalVals: {
  id: number;
  frame: number;
  layer: number;
  length: number;
}[];
const diffVal = (value: number, key: "frame" | "layer" | "length", isSet: boolean): LogProperty => {
  const diffLog = items.diffwrite(originalVals.map(item => item.id), key, originalVals.map(item => item[key]), value, isSet)
  return diffLog
}
const startDiffVal = () => {
  originalVals = items.items.map((item) =>
    (selections.selections.includes(item.id))
      ? JSON.parse(JSON.stringify({
        id: item.id,
        frame: item.frame,
        layer: item.layer,
        length: item.length,
      }))
      : undefined
  ).filter(val => val != undefined)
}

// 画面がタッチされたときの処理 => scriptタグ内の末尾に説明が置いてあります(邪魔だったので移動した)
const touch = touchStore();
// 親階層(HomeView.vue)もクリックを検知する(バブリング)するようにしないとtouch数を取得できないのでevent.stopPropagation();はダメということでbooleanで判定します
let isStopItemBubble = false;
let isStopBackBubble = false;
// 座標の親はcontentのxとpointerPosYRefのy
type Position = {
  x: number;
  y: number;
};

let pointerStartPos: Position;
const pointerPosXRef = ref();
const pointerPosYRef = ref();
const getPos = (event: PointerEvent): Position => {
  return {
    x: event.clientX - pointerPosXRef.value.getBoundingClientRect().left,
    y: event.clientY - pointerPosYRef.value.getBoundingClientRect().top,
  };
};
const registerPointerStartPos = (event: PointerEvent) => {
  pointerStartPos = getPos(event);
};
const getPosDiff = (st: Position, ed: Position): Position => {
  return {
    x: ed.x - st.x,
    y: ed.y - st.y
  }
}
const getPointerDiff = (event: PointerEvent): Position => {
  return getPosDiff(pointerStartPos, getPos(event))
};
const MIN_MOVE = 3; // これ以下の移動は移動とみなさない スマホなどちょっとずれるツールを使うときに長押しをしにくかったので。数字は趣味
const LayerHeight =
  parseFloat(getComputedStyle(document.documentElement).fontSize) * 3; // 3はsize.cssで書いた値
// ほとんど動いていなかったら動いていなかったということにする
const isMoveBig = (event: PointerEvent): boolean => {
  return (
    Math.abs(getPointerDiff(event).x) > MIN_MOVE ||
    Math.abs(getPointerDiff(event).y) > MIN_MOVE
  );
};

const itemEdgeTouchDown = (event: PointerEvent, id: number, edge: "Left" | "Right") => {
  if (/* touch.countDown == 1 &&  */state.userMode == "normal") {
    // タッチした時
    isStopItemBubble = true;
    isStopBackBubble = true;
    // 未選択アイテムなら
    if (!selections.selections.includes(id)) {
      selections.select([id]);
    }
    registerPointerStartPos(event);
    if (edge == "Left") {
      touch.target = "itemEdgeLeft";
    } else if (edge == "Right") {
      touch.target = "itemEdgeRight";
    }
    touch.mode = "wait"
  }
};
const itemTouchStart = (event: PointerEvent, id: number) => {
  if (isStopItemBubble) {
    isStopItemBubble = false;
    return;
  }
  // TODO: touch.countDownやそれに準ずる仕組みでタップしているものが一つだけの状態というので判定する
  if (/* touch.countDown == 1 */true) {
    registerPointerStartPos(event);
    if (state.userMode == "normal") {
      // タッチをしたアイテムが選択済みのものか
      if (selections.selections.includes(id)) {
        // 選択済みItemなら
        touch.target = "selectedItem";
        touch.mode = "wait";
        touch.timeoutId = setTimeout(() => {
          // moveかendでtouchTimeoudIdをundefinedにするので分岐は不要
          touch.mode = "long";
        }, touch.WAIT_TIME);
        isStopBackBubble = true;
      } else {
        // 未選択Itemなら
        touch.target = "unselectedItem";
        touch.mode = "wait";
        selections.select([id]);
        touch.timeoutId = setTimeout(() => {
          // moveかendでtouchTimeoudIdをundefinedにするので分岐は不要
          touch.mode = "long";
        }, touch.WAIT_TIME);
        isStopBackBubble = true;
      }
    } else if (state.userMode == "select") {
      // タッチをしたアイテムが選択済みのものか
      if (selections.selections.includes(id)) {
        // 選択済みアイテムなら抜く
        selections.selectRemove(id);
      } else {
        selections.selectAdd(id);
      }
    }
  } else {
    touch.mode = "";
    touch.target = "";
  }
};
const backTouchStart = (event: PointerEvent) => {
  if (isStopBackBubble) {
    isStopBackBubble = false;
    return;
  }
  // TODO: touch.countDownやそれに準ずる仕組みでタップしているものが一つだけの状態というので判定する
  if (/* touch.countDown == 1 */true) {
    // registerPointerStartPos(event);
    pointerStartPos = {
      x: event.clientX,
      y: event.clientY,
    }
    if (state.userMode == "normal") {
      touch.target = "back";
      touch.mode = "wait";
      scrollSt = scroll.value
      touch.timeoutId = setTimeout(() => {
        if (touch.mode == "wait") {
          touch.mode = "long";
          clearTimeout(touch.timeoutId);
        }
      }, touch.WAIT_TIME);
    }
  }
};

const backTouchMove = (event: PointerEvent) => {
  if (touch.target == "back") {
    if (touch.mode == "wait") {
      if (isMoveBig(event)) {
        touch.mode = "idou";
      }
    }
    if (touch.mode == "idou") {
      scroll.value = getPosDiff(getPosDiff(pointerStartPos, { x: event.clientX, y: event.clientY }), scrollSt)
    }
  }
  if (state.userMode == "normal") {
    if (touch.target == "itemEdgeLeft" || touch.target == "itemEdgeRight") {
      if (touch.mode == "wait") {
        if (isMoveBig(event)) {
          touch.mode = "idou";
          startDiffVal();
        }
      }
      if (touch.mode == "idou") {
        if (touch.target == "itemEdgeLeft") {
          diffVal(- Math.floor(getPointerDiff(event).x / state.ppf), "length", false);
          diffVal(Math.floor(getPointerDiff(event).x / state.ppf), "frame", false);
        }
        else if (touch.target == "itemEdgeRight") {
          diffVal(Math.floor(getPointerDiff(event).x / state.ppf), "length", false);
        }
      }
    } else if (
      touch.target == "selectedItem" ||
      touch.target == "unselectedItem"
    ) {
      if (touch.mode == "wait") {
        if (isMoveBig(event)) {
          touch.mode = "idou";
          clearTimeout(touch.timeoutId);
          startDiffVal();
        }
      } else if (touch.mode == "long") {
        if (isMoveBig(event)) {
          touch.mode = "idou"; // 長押しの最低時間を過ぎて(longになっていて)も、離すまでに移動したら移動になる
          startDiffVal();
        }
      }
      // 移動時の処理
      if (touch.mode == "idou") {
        //////////////////////// アイテムの移動 ////////////////////////
        diffVal(Math.floor(getPointerDiff(event).x / state.ppf), "frame", false);
        diffVal(Math.round(getPointerDiff(event).y / LayerHeight), "layer", false);
      }
    }
  }
};

const backTouchEnd = (event: PointerEvent) => {
  if (state.userMode == "normal") {
    if ((touch.target == "itemEdgeLeft" || touch.target == "itemEdgeRight") && touch.mode != "wait") {
      // waitのときは選択の動作を期待したから
      if (touch.mode == "idou") {
        if (touch.target == "itemEdgeLeft") {
          const diffLogL = diffVal(- Math.floor(getPointerDiff(event).x / state.ppf), "length", true);
          const diffLogF = diffVal(Math.floor(getPointerDiff(event).x / state.ppf), "frame", true);
          log.add([diffLogL, diffLogF])
        }
        else if (touch.target == "itemEdgeRight") {
          const diffLog = diffVal(Math.floor(getPointerDiff(event).x / state.ppf), "length", true);
          log.add([diffLog])
        }
      }
      // 後片付け
      touch.target = "";
      touch.mode = "";
      clearTimeout(touch.timeoutId);
    } else if (
      touch.target == "selectedItem" ||
      touch.target == "unselectedItem" ||
      ((touch.target == "itemEdgeLeft" || touch.target == "itemEdgeRight") && touch.mode == "wait")
    ) {
      if (touch.mode == "wait") {
        // アイテムをタッチした時の処理
        if (touch.target == "selectedItem") {
          // プロパティ編集画面表示
          setTimeout(() => {
            itemPropertyDialogShow();
          }, 1);
        }
      } else if (touch.mode == "idou") {
        // アイテムを移動した時の処理
        const diffLogF = diffVal(Math.floor(getPointerDiff(event).x / state.ppf), "frame", true);
        const diffLogL = diffVal(Math.round(getPointerDiff(event).y / LayerHeight), "layer", true);
        log.add([diffLogF, diffLogL])
      } else if (touch.mode == "long") {
        // アイテムを長押しした時の処理
        //////////////////////// オプション表示(コピーとか) ////////////////////////
        //////////////////////////////////////////////////////////////////////////
        navigator.clipboard
          .readText()
          .then(
            (clipText) => (console.log(clipText)),
          );
          clipBoardTest()


      } else {
        // なんかよくわからないことが起きてる時にここにきます
        console.error("よくわからんことが起きとります(アイテムのタッチ)");
        return;
      }
      // 後片付け
      touch.target = "";
      touch.mode = "";
      clearTimeout(touch.timeoutId);
    } else if (touch.target == "back") {
      if (touch.mode == "wait") {
        selections.reset();
      } else if (touch.mode == "long") {
        ///////////////////////// オプション表示(貼付とか) /////////////////////////
        //////////////////////////////////////////////////////////////////////////
        touch.target = "";
        touch.mode = "";
      }
      // 後片付け
      touch.target = "";
      touch.mode = "";
      clearTimeout(touch.timeoutId);
    }
  }
};
const backTouchCancel = (event: PointerEvent) => {
  // console.log(event.type)
};

const clipBoardTest = async () => {
  console.log("clipBoardTest")
  const a = await navigator.clipboard.read()
  for (const b of a) {
  /* console.log(b.presentationStyle)
    console.log(b.types)
    console.log(b.getType)
    const blob = await b.getType("image/png");
    console.log(blob) */
  }
};

const itemEnter = (id: number) => {
  if (touch.countDown == 1 && state.userMode == "select") {
    selections.selectAdd(id);
  }
};
/* # どこをどうタッチするか
<< 一本タッチの時 >>
[通常モード](normal)
アイテムの長さ変更部分を (itemEdge) // 注:アイテムが選択済みで、この通常モードの時以外出現しない
移動
 長さ変更プレビュー(move)
 長さ変更を反映(end)

選択済みアイテムを (selectedItem)
タッチ
 プロパティ編集画面表示(end)
移動
 選択済みアイテム全てを移動をプレビュー(move)
 変更を反映(end)
移動なし長押し
 オプション欄<コピーとかのやつ>表示(end)

未選択アイテムを (unselectedItem)
タッチ
 他のアイテムの選択を解除し、タッチしたアイテムを選択(start)
移動
 他のアイテムの選択を解除し、タッチしたアイテムを選択(start)
 アイテム移動をプレビュー(move)
 変更を反映(end)
移動なし長押し
 他のアイテムの選択を解除し、タッチしたアイテムを選択(start)
 オプション欄<コピーとかのやつ>表示(end)

後ろを (back)
タッチ
 選択解除
移動
 特になし //scrollが普通に動く
移動なし長押し
 オプション欄<貼り付けとかのやつ>表示(end)

[選択モード]
選択済みアイテムを
タッチ
 そのアイテムの選択を解除(start)
なぞる
 そのアイテムを選択(move)

未選択アイテムを
タッチ
 そのアイテムを選択(start)
なぞる
 そのアイテムを選択(move)

<< 二本タッチの時 >>
後ろを (back)
 タイムラインを拡大縮小(move)

# 通常モードでの処理の流れ
startで
 touch.targetを設定
 touchModeをwait(単押し)or wait2(複数押し)で設定
 touchMode, targetに応じた処理
 WAIT_TIMEミリ秒後にまだwait状態だったらtouchModeをlongへ変更// 長押しを判定, setTimeout
move
 touchModeをmoveへ変更
 touchMode, targetに応じた処理
endで
 touch.target, touchModeをリセ
 touchMode, targetに応じた処理

他の所でタッチして移動していって別の所をなぞる・別の所で離すという可能性を考えいかなければならないらしい！面倒！
*/
</script>

<style scoped>
.unselectable {
  user-select: none;
  /* テキスト選択を禁止 */
  -webkit-user-select: none;
  /* Safari用 */
  -moz-user-select: none;
  /* Firefox用 */
  -ms-user-select: none;
  /* 旧IE用 */
}

.x-scrollable {
  width: 100%;
  height: 100%;
}

.x-container {
  display: flex;
  flex-flow: column;
  height: 100%;
  background-color: var(--color-background);
}

.y-scrollable {
  height: 100%;
}

.y-container {
  display: flex;
  flex-flow: column;
  height: fit-content;
}

.layer {
  height: var(--height-layer);
  font-size: var(--fontsize-item);
  line-height: var(--height-item);
  white-space: nowrap;
  width: fit-content;
  display: flex;
  flex-flow: row;
}

.timeline-row {
  width: 20vw;
  padding-top: var(--height-tlmargin);
  border-right: medium solid var(--color-border);
  overflow: hidden;
}

.horizontal-line {
  height: 1px;
  width: 100%;
  background-color: var(--color-border);
}

.play-bar {
  pointer-events: none;
  position: absolute;
  left: 20vw;
  top: 0;
  height: 100%;
  width: 5px;
  background-color: red;
}

.play-bar-icon {
  background-color: var(--color-background);
  width: fit-content;
  white-space: nowrap;
}
</style>