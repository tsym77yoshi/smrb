// ほぼchat-gptの出力
export class ReusableAudioPlayer {
  private context: AudioContext;
  private gainNode: GainNode;
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;

  constructor() {
    this.context = new AudioContext();
    this.gainNode = this.context.createGain();
    this.gainNode.connect(this.context.destination);
  }

  async loadAudio(blob: Blob): Promise<void> {
    const arrayBuffer = await blob.arrayBuffer(); // Blob を ArrayBuffer に変換
    this.buffer = await this.context.decodeAudioData(arrayBuffer);
  }

  isLoaded(): boolean {
    return this.buffer != null;
  }

  play(startTime: number = 0): void {
    if (!this.buffer) {
      console.error("Audio not loaded.");
      return;
    }

    // 新しいAudioBufferSourceNodeを作成
    this.source = this.context.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.connect(this.gainNode);

    // 再生
    this.source.start(this.context.currentTime, startTime);
  }

  stop(): void {
    if (this.source) {
      this.source.stop(); // 現在の再生を停止
      this.source = null; // 再利用不可なので破棄
    }
  }

  setVolume(volume: number): void {
    this.gainNode.gain.setValueAtTime(volume, this.context.currentTime);
  }
}
