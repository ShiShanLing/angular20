import { Component, ElementRef, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsQR from 'jsqr';
import QRCode from 'qrcode';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzAlertModule } from 'ng-zorro-antd/alert';

type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

const STORAGE_KEY = 'tools_qrcode_text';
const MAX_DECODE_SIDE = 1800;
const DECODE_SCALES = [1, 1.5, 2, 0.75];

/** 二维码工具：文本生成二维码、图片解码、摄像头扫描。 */
@Component({
  selector: 'app-tools-qrcode',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzInputModule,
    NzButtonModule,
    NzSpaceModule,
    NzTabsModule,
    NzIconModule,
    NzSelectModule,
    NzGridModule,
    NzAlertModule
  ],
  templateUrl: './tools-qrcode.component.html',
  styleUrl: './tools-qrcode.component.scss'
})
export class ToolsQrcodeComponent implements OnInit, OnDestroy {
  private readonly imageInputRef = viewChild<ElementRef<HTMLInputElement>>('imageInput');
  private readonly videoRef = viewChild<ElementRef<HTMLVideoElement>>('scanVideo');
  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('scanCanvas');

  private mediaStream: MediaStream | null = null;
  private scanFrameId: number | null = null;
  private lastScanResult = '';

  readonly generateText = signal('');
  readonly qrDataUrl = signal<string | null>(null);
  readonly qrSize = signal(256);
  readonly errorLevel = signal<ErrorCorrectionLevel>('M');
  readonly generating = signal(false);
  
  readonly decodeResult = signal('');
  readonly imagePreview = signal<string | null>(null);
  readonly decoding = signal(false);

  readonly cameraActive = signal(false);
  readonly cameraError = signal('');
  //这周把
  readonly sizeOptions = [128, 192, 256, 384, 512];
  readonly levelOptions: { label: string; value: ErrorCorrectionLevel }[] = [
    { label: '低 (L)', value: 'L' },
    { label: '中 (M)', value: 'M' },
    { label: '较高 (Q)', value: 'Q' },
    { label: '高 (H)', value: 'H' }
  ];

  constructor(private readonly msg: NzMessageService) {}

  ngOnInit(): void {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      this.generateText.set(saved);
    }
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  onGenerateTextChange(value: string): void {
    this.generateText.set(value);
    localStorage.setItem(STORAGE_KEY, value);
  }

  async generateQrCode(): Promise<void> {
    const text = this.generateText().trim();
    if (!text) {
      this.msg.warning('请输入要编码的文本或链接');
      return;
    }
    
    this.generating.set(true);
    try {
      const dataUrl = await QRCode.toDataURL(text, {
        width: this.qrSize(),
        margin: 2,
        errorCorrectionLevel: this.errorLevel()
      });
      this.qrDataUrl.set(dataUrl);
    } catch {
      this.msg.error('生成失败，请检查内容是否过长或包含非法字符');
      this.qrDataUrl.set(null);
    } finally {
      this.generating.set(false);
    }
  }

  downloadQrCode(): void {
    const dataUrl = this.qrDataUrl();
    if (!dataUrl) {
      this.msg.warning('请先生成二维码');
      return;
    }
    /* 
。
    */
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `qrcode-${Date.now()}.png`;
    link.click();
    this.msg.success('已开始下载');
  }
  async copyText(value: string, emptyTip: string): Promise<void> {
    if (!value.trim()) {
      this.msg.warning(emptyTip);
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      this.msg.success('已复制到剪贴板');
    } catch {
      this.msg.error('复制失败，请手动选择复制');
    }
  }
  
  /*



可以先这样说：避免卡帧的核心是减少每一帧主线程和渲染管线的工作量，重活后台化，UI 更新轻量化，列表、图片、布局和图层效果重点优化，并用工具量化验证。

常见原因包括：主线程做大量计算、同步文件 IO、同步数据库查询、大 JSON 解析、复杂 Auto Layout、列表 Cell 太重、大图解码、频繁 reloadData、频繁 layoutIfNeeded、圆角阴影导致离屏渲染、透明视图过多导致混合成本高、主线程等待锁或信号量。

优化可以从这些方向做：

1. 主线程只做 UI 和轻量逻辑：计算、JSON 解析、文件读写、数据库查询、图片处理等不要放在主线程。后台处理完成后再回主线程更新 UI。

2. 列表要轻：UITableView/UICollectionView 的 cellForRow 或 cellForItem 里不要做同步 IO、复杂计算、大图解码。要复用 Cell，异步加载图片，取消复用前的旧请求，缓存图片和布局结果，必要时预计算高度，避免每次滑动都重新算复杂布局。


3. 图片要小、要缓存、尽量后台解码：服务端最好返回合适尺寸的图片，列表不要加载原图。客户端可以使用缩略图、内存/磁盘缓存、后台解码和按需加载，避免大图在主线程解码造成瞬间卡顿。

4. 布局要简单：减少 view 层级和约束数量，避免 Cell 内嵌套过深；不要频繁调用 setNeedsLayout/layoutIfNeeded；复杂列表可以缓存高度或考虑手动布局；StackView 很方便，但在特别复杂和高频复用场景也要注意开销。

5. 减少无效 UI 刷新：不要动不动全量 reloadData。优先局部刷新、批量更新、Diffable Data Source 或差量更新；高频输入、滚动、搜索场景可以用防抖/节流；多次状态变化可以合并成一次 UI 刷新。

6. 控制渲染成本：避免大量透明视图重叠，减少 alpha 混合；谨慎使用圆角加阴影、mask、shouldRasterize、模糊效果等可能增加渲染成本的效果；圆角阴影可以用阴影路径 shadowPath、预渲染图片或拆分图层优化。

7. 避免主线程等待：不要在主线程等待网络、数据库、锁、信号量或异步任务结果。比如 DispatchSemaphore.wait、DispatchQueue.sync、锁竞争都可能让主线程卡住甚至死锁。

8. 分批和懒加载：首屏只加载当前可见内容，非首屏模块延迟加载；大量数据分页加载；复杂任务分批处理，避免一次性把所有工作压到同一帧。

排查工具也很重要：Time Profiler 看主线程 CPU 耗时函数；Core Animation 看 FPS、掉帧和渲染问题；Xcode Debug Navigator 看 CPU/内存粗略变化；View Debugger 看 UI 层级和遮挡；Instruments Allocations 看对象分配是否异常；卡住时可以暂停 App，用 LLDB 的 thread backtrace all 看主线程是否卡在 IO、锁、数据库、JSON 解析或布局里；线上可以用 MetricKit、RunLoop 卡顿监控、FPS 监控和主线程堆栈采样。

一个常见回答模板是：我会先确认卡顿场景，比如列表滑动、页面转场还是启动首屏；然后用 Time Profiler 和 Core Animation 找主线程或渲染瓶颈；优化上把重活后台化，减少 cell 内同步工作，图片缩放缓存和后台解码，减少约束和层级，局部刷新代替全量刷新，避免主线程等锁；最后用 FPS、耗时和线上卡顿率对比优化前后效果。

总结：避免卡帧就是守住每帧时间预算。主线程少做事，列表和图片重点优化，布局和渲染尽量简单，刷新要合并，锁和同步等待不能卡主线程，最终用 Instruments、MetricKit 和卡顿监控验证。
  */
  openImagePicker(): void {
    this.imageInputRef()?.nativeElement.click();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }

    this.readAndDecodeImageFile(file, '请选择图片文件');
  }

  onImagePasted(event: ClipboardEvent): void {
    const imageFile = this.getPastedImageFile(event);
    if (!imageFile) {
      this.msg.warning('剪贴板中没有图片，请先复制截图或二维码图片');
      return;
    }

    event.preventDefault();
    this.readAndDecodeImageFile(imageFile, '剪贴板内容不是图片');
  }

  private readAndDecodeImageFile(file: File, invalidTip: string): void {
    if (!file.type.startsWith('image/')) {
      this.msg.warning(invalidTip);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      this.imagePreview.set(dataUrl);
      void this.decodeFromDataUrl(dataUrl);
    };
    reader.onerror = () => this.msg.error('读取图片失败');
    reader.readAsDataURL(file);
  }

  private getPastedImageFile(event: ClipboardEvent): File | null {
    const items = Array.from(event.clipboardData?.items ?? []);
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        return item.getAsFile();
      }
    }

    const files = Array.from(event.clipboardData?.files ?? []);
    return files.find((file) => file.type.startsWith('image/')) ?? null;
  }

  async decodeFromDataUrl(dataUrl: string): Promise<void> {
    this.decoding.set(true);
    this.decodeResult.set('');
    try {
      const result = await this.decodeImageDataUrl(dataUrl);
      if (result) {
        this.decodeResult.set(result);
        this.msg.success('解码成功');
      } else {
        this.msg.warning('未识别到二维码，请换一张更清晰的图片');
      }
    } catch {
      this.msg.error('解码失败');
    } finally {
      this.decoding.set(false);
    }
  }

  async startCamera(): Promise<void> {
    if (this.cameraActive()) {
      return;
    }

    this.cameraError.set('');
    this.lastScanResult = '';

    if (!navigator.mediaDevices?.getUserMedia) {
      this.cameraError.set('当前浏览器不支持摄像头访问，或页面不是 HTTPS / localhost');
      return;
    }

    try {
      this.mediaStream = await this.openCameraStream();
      const video = this.videoRef()?.nativeElement;
      if (!video) {
        this.stopCamera();
        return;
      }
      video.srcObject = this.mediaStream;
      this.cameraActive.set(true);
      await this.waitForVideoReady(video);
      await video.play();
      this.scanLoop();
    } catch (error) {
      this.cameraError.set(this.getCameraErrorMessage(error));
      this.stopCamera();
    }
  }

  stopCamera(): void {
    if (this.scanFrameId !== null) {
      cancelAnimationFrame(this.scanFrameId);
      this.scanFrameId = null;
    }
    this.mediaStream?.getTracks().forEach(track => track.stop());
    this.mediaStream = null;

    const video = this.videoRef()?.nativeElement;
    if (video) {
      video.srcObject = null;
    }
    this.cameraActive.set(false);
  }

  private scanLoop(): void {
    const video = this.videoRef()?.nativeElement;
    const canvas = this.canvasRef()?.nativeElement;
    if (!video || !canvas || !this.cameraActive()) {
      return;
    }

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context || video.readyState < video.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) {
      this.scanFrameId = requestAnimationFrame(() => this.scanLoop());
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
    if (code?.data && code.data !== this.lastScanResult) {
      this.lastScanResult = code.data;
      this.decodeResult.set(code.data);
      this.msg.success('扫描成功');
    }

    this.scanFrameId = requestAnimationFrame(() => this.scanLoop());
  }

  private async decodeImageDataUrl(dataUrl: string): Promise<string | null> {
    const image = await this.loadImage(dataUrl);
    const nativeResult = await this.decodeWithBarcodeDetector(image);
    if (nativeResult) {
      return nativeResult;
    }

    for (const scale of DECODE_SCALES) {
      const canvas = this.createDecodeCanvas(image, scale);
      const directResult = this.decodeCanvasWithJsQr(canvas);
      if (directResult) {
        return directResult;
      }

      const enhancedResult = this.decodeEnhancedCanvas(canvas);
      if (enhancedResult) {
        return enhancedResult;
      }

      const tiledResult = this.decodeCanvasTiles(canvas);
      if (tiledResult) {
        return tiledResult;
      }
    }

    return null;
  }

  private loadImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        resolve(image);
      };
      image.onerror = () => reject(new Error('image load failed'));
      image.src = dataUrl;
    });
  }

  private async decodeWithBarcodeDetector(image: HTMLImageElement): Promise<string | null> {
    const Detector = (globalThis as { BarcodeDetector?: new (options: { formats: string[] }) => { detect(source: CanvasImageSource): Promise<Array<{ rawValue?: string }>> } }).BarcodeDetector;
    if (!Detector) {
      return null;
    }

    try {
      const detector = new Detector({ formats: ['qr_code'] });
      const results = await detector.detect(image);
      return results.find((item) => item.rawValue)?.rawValue ?? null;
    } catch {
      return null;
    }
  }

  private createDecodeCanvas(image: HTMLImageElement, scale: number): HTMLCanvasElement {
    const baseScale = Math.min(1, MAX_DECODE_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
    const finalScale = baseScale * scale;
    const width = Math.max(1, Math.round(image.naturalWidth * finalScale));
    const height = Math.max(1, Math.round(image.naturalHeight * finalScale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      throw new Error('canvas unavailable');
    }
    context.imageSmoothingEnabled = false;
    context.drawImage(image, 0, 0, width, height);
    return canvas;
  }

  private decodeCanvasWithJsQr(canvas: HTMLCanvasElement): string | null {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      return null;
    }
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
    return code?.data ?? null;
  }

  private decodeEnhancedCanvas(canvas: HTMLCanvasElement): string | null {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      return null;
    }

    const original = context.getImageData(0, 0, canvas.width, canvas.height);
    const highContrast = this.createHighContrastImageData(original);
    let code = jsQR(highContrast.data, highContrast.width, highContrast.height, { inversionAttempts: 'attemptBoth' });
    if (code?.data) {
      return code.data;
    }

    const thresholded = this.createThresholdImageData(original);
    code = jsQR(thresholded.data, thresholded.width, thresholded.height, { inversionAttempts: 'attemptBoth' });
    return code?.data ?? null;
  }

  private decodeCanvasTiles(canvas: HTMLCanvasElement): string | null {
    const tileSize = Math.min(Math.max(Math.round(Math.min(canvas.width, canvas.height) * 0.9), 360), 900);
    const step = Math.max(180, Math.round(tileSize * 0.55));

    for (let y = 0; y < canvas.height; y += step) {
      for (let x = 0; x < canvas.width; x += step) {
        const sourceWidth = Math.min(tileSize, canvas.width - x);
        const sourceHeight = Math.min(tileSize, canvas.height - y);
        if (sourceWidth < 160 || sourceHeight < 160) {
          continue;
        }

        const tile = document.createElement('canvas');
        tile.width = sourceWidth;
        tile.height = sourceHeight;
        const tileContext = tile.getContext('2d', { willReadFrequently: true });
        if (!tileContext) {
          continue;
        }
        tileContext.drawImage(canvas, x, y, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);

        const directResult = this.decodeCanvasWithJsQr(tile);
        if (directResult) {
          return directResult;
        }

        const enhancedResult = this.decodeEnhancedCanvas(tile);
        if (enhancedResult) {
          return enhancedResult;
        }
      }
    }

    return null;
  }

  private createHighContrastImageData(source: ImageData): ImageData {
    const output = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
    const data = output.data;
    const contrast = 1.35;
    const brightness = 8;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = this.clampColor((data[i] - 128) * contrast + 128 + brightness);
      data[i + 1] = this.clampColor((data[i + 1] - 128) * contrast + 128 + brightness);
      data[i + 2] = this.clampColor((data[i + 2] - 128) * contrast + 128 + brightness);
    }

    return output;
  }

  private createThresholdImageData(source: ImageData): ImageData {
    const output = new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
    const data = output.data;
    let total = 0;
    const pixelCount = source.width * source.height;

    for (let i = 0; i < data.length; i += 4) {
      total += this.luminance(data[i], data[i + 1], data[i + 2]);
    }

    const threshold = total / pixelCount;
    for (let i = 0; i < data.length; i += 4) {
      const value = this.luminance(data[i], data[i + 1], data[i + 2]) >= threshold ? 255 : 0;
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
    }

    return output;
  }

  private luminance(red: number, green: number, blue: number): number {
    return 0.299 * red + 0.587 * green + 0.114 * blue;
  }

  private clampColor(value: number): number {
    return Math.max(0, Math.min(255, Math.round(value)));
  }

  private async openCameraStream(): Promise<MediaStream> {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'OverconstrainedError') {
        return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      throw error;
    }
  }

  private waitForVideoReady(video: HTMLVideoElement): Promise<void> {
    if (video.readyState >= video.HAVE_METADATA && video.videoWidth && video.videoHeight) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        cleanup();
        reject(new Error('video metadata timeout'));
      }, 5000);

      const onReady = () => {
        if (!video.videoWidth || !video.videoHeight) {
          return;
        }
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        reject(new Error('video load failed'));
      };

      const cleanup = () => {
        window.clearTimeout(timeoutId);
        video.removeEventListener('loadedmetadata', onReady);
        video.removeEventListener('loadeddata', onReady);
        video.removeEventListener('canplay', onReady);
        video.removeEventListener('error', onError);
      };

      video.addEventListener('loadedmetadata', onReady);
      video.addEventListener('loadeddata', onReady);
      video.addEventListener('canplay', onReady);
      video.addEventListener('error', onError);
    });
  }

  private getCameraErrorMessage(error: unknown): string {
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
        return '摄像头权限被拒绝，请允许浏览器访问摄像头后重试';
      }
      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        return '没有找到可用摄像头，请检查设备后重试';
      }
      if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        return '摄像头正被其他应用占用，请关闭占用后重试';
      }
    }

    return '无法打开摄像头，请检查权限、HTTPS 环境或改用图片解码';
  }
}
