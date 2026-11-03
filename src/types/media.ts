export type ImageFormat = 'webp' | 'avif' | 'jpeg' | 'png';

export interface ImageResizeConfig {
  mode: 'original' | 'scale' | 'maxDim' | 'custom';
  scalePercent: number; // e.g. 75, 50, 25
  maxDimension: number; // e.g. 1920, 1080
  customWidth?: number;
  customHeight?: number;
  keepAspectRatio: boolean;
}

export interface ImageConversionOptions {
  format: ImageFormat;
  quality: number; // 1 to 100
  resize: ImageResizeConfig;
}

export interface ProcessedImageItem {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  previewUrl: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  resultBlob?: Blob;
  resultUrl?: string;
  resultSize?: number;
  resultWidth?: number;
  resultHeight?: number;
  resultFormat?: ImageFormat;
  reductionPercentage?: number;
  errorMessage?: string;
}

export type AudioFormat = 'mp3' | 'wav' | 'aac' | 'ogg' | 'flac';
export type AudioBitrate = '320k' | '256k' | '192k' | '128k' | '64k';

export interface AudioExtractionOptions {
  format: AudioFormat;
  bitrate: AudioBitrate;
  sampleRate: number; // 44100 or 48000
}

export interface VideoTrimOptions {
  startTime: number; // in seconds
  endTime: number; // in seconds
  fastCut: boolean; // stream copy (-c copy) or re-encode
  audioExtraction?: boolean;
}

export interface VideoOptimizationOptions {
  targetFormat: 'mp4' | 'webm' | 'gif';
  qualityCrf: number; // 18 (near lossless) to 35 (heavy compression)
  fps: number; // 10, 15, 24, 30, 60
  scaleWidth?: number; // e.g. 720, 480
}

export interface FFmpegProgress {
  progress: number; // 0 to 1
  time: number; // in microseconds
}

export type FFmpegStatus = 'unloaded' | 'loading' | 'ready' | 'processing' | 'error';

