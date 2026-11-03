import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import type { AudioExtractionOptions, FFmpegStatus, VideoOptimizationOptions, VideoTrimOptions } from '../types/media';
import { getFilenameWithoutExtension } from '../utils/formatters';

type StatusListener = (status: FFmpegStatus, message?: string) => void;
type ProgressListener = (progress: number) => void;
type LogListener = (message: string) => void;

class FFmpegService {
  private ffmpeg: FFmpeg | null = null;
  private status: FFmpegStatus = 'unloaded';
  private statusListeners: Set<StatusListener> = new Set();
  private progressListeners: Set<ProgressListener> = new Set();
  private logListeners: Set<LogListener> = new Set();
  private loadPromise: Promise<FFmpeg> | null = null;

  public getStatus(): FFmpegStatus {
    return this.status;
  }

  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  public subscribeProgress(listener: ProgressListener): () => void {
    this.progressListeners.add(listener);
    return () => this.progressListeners.delete(listener);
  }

  public subscribeLogs(listener: LogListener): () => void {
    this.logListeners.add(listener);
    return () => this.logListeners.delete(listener);
  }

  private setStatus(status: FFmpegStatus, message?: string) {
    this.status = status;
    this.statusListeners.forEach((l) => l(status, message));
  }

  public async load(): Promise<FFmpeg> {
    if (this.ffmpeg && this.ffmpeg.loaded) {
      return this.ffmpeg;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = (async () => {
      this.setStatus('loading', 'Chargement du moteur WebAssembly FFmpeg...');

      const ffmpeg = new FFmpeg();
      this.ffmpeg = ffmpeg;

      ffmpeg.on('log', ({ message }) => {
        this.logListeners.forEach((l) => l(message));
      });

      ffmpeg.on('progress', ({ progress }) => {
        const pct = Math.min(100, Math.max(0, Math.round(progress * 100)));
        this.progressListeners.forEach((l) => l(pct));
      });

      // Try primary CDN (unpkg)
      try {
        const cdnBase = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${cdnBase}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${cdnBase}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        this.setStatus('ready', 'Moteur WebAssembly FFmpeg actif');
        return ffmpeg;
      } catch (unpkgErr) {
        console.warn('unpkg FFmpeg load failed, attempting jsDelivr fallback...', unpkgErr);
        try {
          // Secondary CDN fallback (jsdelivr)
          const jsdelivrBase = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm';
          await ffmpeg.load({
            coreURL: await toBlobURL(`${jsdelivrBase}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${jsdelivrBase}/ffmpeg-core.wasm`, 'application/wasm'),
          });
          this.setStatus('ready', 'Moteur FFmpeg actif (via CDN jsDelivr)');
          return ffmpeg;
        } catch (fallbackErr: unknown) {
          const err = fallbackErr as Error;
          this.setStatus('error', err?.message || 'Échec du chargement de FFmpeg');
          this.loadPromise = null;
          throw err;
        }
      }
    })();

    return this.loadPromise;
  }

  /**
   * Extract audio from video file
   */
  public async extractAudio(
    videoData: Uint8Array,
    inputFilename: string,
    options: AudioExtractionOptions,
    onProgress?: (progress: number) => void
  ): Promise<{ data: Uint8Array; filename: string; mimeType: string }> {
    const ffmpeg = await this.load();
    this.setStatus('processing', "Extraction de l'audio...");

    const ext = inputFilename.substring(inputFilename.lastIndexOf('.')) || '.mp4';
    const inputName = `input_${Date.now()}${ext}`;
    const baseName = getFilenameWithoutExtension(inputFilename);
    const outputName = `${baseName}_audio.${options.format}`;

    let unsubProgress: (() => void) | null = null;
    if (onProgress) {
      unsubProgress = this.subscribeProgress(onProgress);
    }

    try {
      await ffmpeg.writeFile(inputName, videoData);

      const args: string[] = ['-i', inputName, '-vn'];

      if (options.format === 'mp3') {
        args.push('-c:a', 'libmp3lame', '-b:a', options.bitrate, '-ar', options.sampleRate.toString());
      } else if (options.format === 'wav') {
        args.push('-c:a', 'pcm_s16le', '-ar', options.sampleRate.toString());
      } else if (options.format === 'aac') {
        args.push('-c:a', 'aac', '-b:a', options.bitrate, '-ar', options.sampleRate.toString());
      } else if (options.format === 'ogg') {
        args.push('-c:a', 'libvorbis', '-b:a', options.bitrate, '-ar', options.sampleRate.toString());
      } else if (options.format === 'flac') {
        args.push('-c:a', 'flac', '-ar', options.sampleRate.toString());
      }

      args.push(outputName);

      await ffmpeg.exec(args);

      const data = (await ffmpeg.readFile(outputName)) as Uint8Array;

      // Cleanup
      await ffmpeg.deleteFile(inputName).catch(() => {});
      await ffmpeg.deleteFile(outputName).catch(() => {});

      const mimeMap: Record<string, string> = {
        mp3: 'audio/mp3',
        wav: 'audio/wav',
        aac: 'audio/aac',
        ogg: 'audio/ogg',
        flac: 'audio/flac',
      };

      this.setStatus('ready');
      return {
        data,
        filename: outputName,
        mimeType: mimeMap[options.format] || 'audio/mpeg',
      };
    } catch (err: unknown) {
      this.setStatus('ready');
      throw err;
    } finally {
      if (unsubProgress) unsubProgress();
    }
  }

  /**
   * Trim / cut video
   */
  public async trimVideo(
    videoData: Uint8Array,
    inputFilename: string,
    options: VideoTrimOptions,
    onProgress?: (progress: number) => void
  ): Promise<{ data: Uint8Array; filename: string; mimeType: string }> {
    const ffmpeg = await this.load();
    this.setStatus('processing', 'Découpage de la vidéo...');

    const ext = inputFilename.substring(inputFilename.lastIndexOf('.')) || '.mp4';
    const inputName = `trim_in_${Date.now()}${ext}`;
    const baseName = getFilenameWithoutExtension(inputFilename);
    const outputName = `${baseName}_cut.mp4`;

    let unsubProgress: (() => void) | null = null;
    if (onProgress) {
      unsubProgress = this.subscribeProgress(onProgress);
    }

    try {
      await ffmpeg.writeFile(inputName, videoData);

      const duration = Math.max(0.1, options.endTime - options.startTime);
      const args: string[] = ['-ss', options.startTime.toFixed(3), '-i', inputName, '-t', duration.toFixed(3)];

      if (options.fastCut) {
        // Fast stream copy (instant, lossless)
        args.push('-c', 'copy', '-avoid_negative_ts', 'make_zero');
      } else {
        // Re-encode for frame-accurate cut
        args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '22', '-c:a', 'aac');
      }

      args.push(outputName);

      await ffmpeg.exec(args);

      const data = (await ffmpeg.readFile(outputName)) as Uint8Array;

      // Cleanup
      await ffmpeg.deleteFile(inputName).catch(() => {});
      await ffmpeg.deleteFile(outputName).catch(() => {});

      this.setStatus('ready');
      return {
        data,
        filename: outputName,
        mimeType: 'video/mp4',
      };
    } catch (err) {
      this.setStatus('ready');
      throw err;
    } finally {
      if (unsubProgress) unsubProgress();
    }
  }

  /**
   * Convert Video to High-Quality GIF or Compress Video
   */
  public async optimizeVideoOrGif(
    videoData: Uint8Array,
    inputFilename: string,
    options: VideoOptimizationOptions,
    onProgress?: (progress: number) => void
  ): Promise<{ data: Uint8Array; filename: string; mimeType: string }> {
    const ffmpeg = await this.load();
    this.setStatus('processing', 'Conversion en cours...');

    const ext = inputFilename.substring(inputFilename.lastIndexOf('.')) || '.mp4';
    const inputName = `opt_in_${Date.now()}${ext}`;
    const baseName = getFilenameWithoutExtension(inputFilename);
    const outputName = `${baseName}_converted.${options.targetFormat}`;

    let unsubProgress: (() => void) | null = null;
    if (onProgress) {
      unsubProgress = this.subscribeProgress(onProgress);
    }

    try {
      await ffmpeg.writeFile(inputName, videoData);

      const args: string[] = ['-i', inputName];

      if (options.targetFormat === 'gif') {
        const width = options.scaleWidth || 480;
        const fps = options.fps || 15;
        // Two-pass palette generation for ultra sharp GIF
        const filter = `fps=${fps},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer`;
        args.push('-vf', filter, '-loop', '0');
      } else if (options.targetFormat === 'webm') {
        args.push('-c:v', 'libvpx', '-crf', options.qualityCrf.toString(), '-b:v', '1M', '-c:a', 'libvorbis');
      } else {
        // MP4 compressed
        args.push('-c:v', 'libx264', '-crf', options.qualityCrf.toString(), '-preset', 'ultrafast', '-c:a', 'aac');
        if (options.scaleWidth) {
          args.push('-vf', `scale=${options.scaleWidth}:-2`);
        }
      }

      args.push(outputName);

      await ffmpeg.exec(args);

      const data = (await ffmpeg.readFile(outputName)) as Uint8Array;

      // Cleanup
      await ffmpeg.deleteFile(inputName).catch(() => {});
      await ffmpeg.deleteFile(outputName).catch(() => {});

      const mimeMap: Record<string, string> = {
        gif: 'image/gif',
        webm: 'video/webm',
        mp4: 'video/mp4',
      };

      this.setStatus('ready');
      return {
        data,
        filename: outputName,
        mimeType: mimeMap[options.targetFormat] || 'application/octet-stream',
      };
    } catch (err) {
      this.setStatus('ready');
      throw err;
    } finally {
      if (unsubProgress) unsubProgress();
    }
  }

  /**
   * Fallback image conversion via FFmpeg (for AVIF if canvas lacks support)
   */
  public async convertImage(
    imageData: Uint8Array,
    inputFilename: string,
    targetFormat: 'avif' | 'webp',
    quality: number
  ): Promise<Uint8Array> {
    const ffmpeg = await this.load();
    const ext = inputFilename.substring(inputFilename.lastIndexOf('.')) || '.png';
    const inputName = `img_in_${Date.now()}${ext}`;
    const outputName = `img_out_${Date.now()}.${targetFormat}`;

    try {
      await ffmpeg.writeFile(inputName, imageData);

      // Map quality (1-100) to CRF or qscale
      const q = Math.round(100 - quality);
      const args = ['-i', inputName];

      if (targetFormat === 'webp') {
        args.push('-c:v', 'libwebp', '-qscale', quality.toString());
      } else {
        args.push('-c:v', 'libsvtav1', '-crf', Math.max(15, Math.min(50, Math.round(q * 0.5 + 20))).toString());
      }

      args.push(outputName);
      await ffmpeg.exec(args);

      const data = (await ffmpeg.readFile(outputName)) as Uint8Array;
      await ffmpeg.deleteFile(inputName).catch(() => {});
      await ffmpeg.deleteFile(outputName).catch(() => {});

      return data;
    } catch (err) {
      throw err;
    }
  }
}

export const ffmpegService = new FFmpegService();
