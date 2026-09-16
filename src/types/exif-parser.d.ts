declare module "exif-parser" {
  export interface ExifParser {
    parse(): {
      tags?: {
        DateTimeOriginal?: number;
        Make?: string;
        Model?: string;
        GPSLatitude?: number;
        GPSLongitude?: number;
        [key: string]: any;
      };
      imageSize?: {
        width: number;
        height: number;
      };
    };
  }

  export function create(buffer: Buffer): ExifParser;
}
