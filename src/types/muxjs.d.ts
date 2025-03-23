declare module 'mux.js' {
  export namespace mp4 {
    class Transmuxer {
      constructor(options?: { keepOriginalTimestamps?: boolean });
      on(event: string, callback: (data: any) => void): void;
      push(data: Uint8Array): void;
      flush(): void;
    }

    class Track {
      constructor();
    }
  }
}
