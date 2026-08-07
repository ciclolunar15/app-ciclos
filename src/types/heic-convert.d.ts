declare module "heic-convert" {
  interface OpcionesConversion {
    buffer: Buffer | Uint8Array;
    format: "JPEG" | "PNG";
    quality?: number;
  }

  export default function convert(opciones: OpcionesConversion): Promise<Buffer>;
}
