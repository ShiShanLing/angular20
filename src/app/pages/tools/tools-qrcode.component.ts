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
    if (!file.type.startsWith('image/')) {
      this.msg.warning('请选择图片文件');
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

  private decodeImageDataUrl(dataUrl: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
          reject(new Error('canvas unavailable'));
          return;
        }
        context.drawImage(image, 0, 0);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
        resolve(code?.data ?? null);
      };
      image.onerror = () => reject(new Error('image load failed'));
      image.src = dataUrl;
    });
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
