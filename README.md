# スマホ編集SMRB(SpeechsynthMovie楽々Builder、合成音声動画楽々制作)
スマホブラウザで合成音声キャラクター動画制作をする為に作られた動画制作ツール

## 非対応ブラウザ
Firefox for android(webcodecs/videoEncoder)

## ユーザーの方へ
このツールは現状一人前のツールとは言い難い状態です。作業データが飛んでも涙が流れない程度の編集でお試しください。

### Tips
#### 出力について
出力にべらぼうに時間がかかると思います。ブラウザ上でffmpeg.wasmのシングルコアを実行しているからなのですが、ネイティブアプリ(ブラウザじゃないアプリのこと)でffmpegを実行するときの約25倍時間がかかるらしいです。

## コードを読む人へ
### なんでブラウザ？
~~ストア面倒そう~~
知名度、更新の手間等々を勘案し検討を重ねた結果、ブラウザの方が良いという結論に至ったからです

### とりあえず実行するまでの手順

### idについて
TLItemのidとFileIdがあるので注意！

以下、デフォルトで書いてあったやつ

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```
