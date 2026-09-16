declare module "heic-decode" {
  interface HeicDecodeResult {
    data: ArrayBuffer;
    width: number;
    height: number;
  }
  export default function decode(options: { buffer: Buffer | Uint8Array }): Promise<HeicDecodeResult>;
}
