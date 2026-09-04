import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  viewChild,
  signal,
  computed,
} from '@angular/core';

export const DRAW_COLORS = [
  { id: 'ink', value: '#141414', label: '黑色' },
  { id: 'white', value: '#ffffff', label: '白色' },
  { id: 'red', value: '#f5222d', label: '红色' },
  { id: 'orange', value: '#fa8c16', label: '橙色' },
  { id: 'yellow', value: '#fadb14', label: '黄色' },
  { id: 'green', value: '#52c41a', label: '绿色' },
  { id: 'blue', value: '#1677ff', label: '蓝色' },
  { id: 'purple', value: '#722ed1', label: '紫色' },
] as const;

export const DRAW_WIDTHS = [
  { id: 'thin', value: 2, label: '细' },
  { id: 'medium', value: 5, label: '中' },
  { id: 'thick', value: 10, label: '粗' },
  { id: 'bold', value: 18, label: '特粗' },
] as const;

export const DRAW_TOOLS = [
  { id: 'free', label: '随意画' },
  { id: 'line', label: '直线' },
  { id: 'ellipse', label: '椭圆' },
  { id: 'circle', label: '圆' },
  { id: 'rect', label: '方块' },
] as const;

export type DrawToolId = (typeof DRAW_TOOLS)[number]['id'];

interface DrawPoint {
  x: number;
  y: number;
}

/** 简易画板：颜色、粗细、画笔类型（随意画 / 直线 / 椭圆 / 圆 / 方块）。 */
@Component({
  selector: 'app-tools-draw',
  templateUrl: './tools-draw.component.html',
  styleUrl: './tools-draw.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'onDocumentKeydown($event)',
  },
})
export class ToolsDrawComponent implements AfterViewInit, OnDestroy {
  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly stageRef = viewChild<ElementRef<HTMLElement>>('stage');
  private ctx: CanvasRenderingContext2D | null = null;
  private drawing = false;
  private startPoint: DrawPoint | null = null;
  private lineAnchor: DrawPoint | null = null;
  private snapshot: ImageData | null = null;
  private resizeObserver: ResizeObserver | null = null;

  readonly colors = DRAW_COLORS;
  readonly widths = DRAW_WIDTHS;
  readonly tools = DRAW_TOOLS;
  readonly color = signal<string>(
    DRAW_COLORS.find((item) => item.id === 'red')?.value ?? '#f5222d'
  );
  readonly width = signal<number>(DRAW_WIDTHS[1].value);
  readonly tool = signal<DrawToolId>('free');
  readonly lineChaining = signal(false);
  readonly currentColorLabel = computed(
    () => this.colors.find((item) => item.value === this.color())?.label ?? '颜色'
  );
  readonly currentToolLabel = computed(
    () => this.tools.find((item) => item.id === this.tool())?.label ?? '画笔'
  );
  readonly currentWidthLabel = computed(
    () => this.widths.find((item) => item.value === this.width())?.label ?? '粗细'
  );

  ngAfterViewInit(): void {
    const canvas = this.canvasRef()?.nativeElement;
    const stage = this.stageRef()?.nativeElement;
    if (!canvas || !stage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.ctx = ctx;
    this.fitCanvas();
    this.resizeObserver = new ResizeObserver(() => this.fitCanvas());
    this.resizeObserver.observe(stage);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  setColor(value: string): void {
    this.color.set(value);
  }

  setWidth(value: number): void {
    this.width.set(value);
  }

  setTool(value: DrawToolId): void {
    this.finishPolyline();
    this.tool.set(value);
  }

  clearCanvas(): void {
    this.finishPolyline();
    const canvas = this.canvasRef()?.nativeElement;
    const ctx = this.ctx;
    if (!canvas || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    this.snapshot = null;
  }

  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.finishPolyline();
    }
  }

  onPointerDown(event: PointerEvent): void {
    const canvas = this.canvasRef()?.nativeElement;
    const ctx = this.ctx;
    if (!canvas || !ctx) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    if (this.tool() === 'line') {
      this.onLinePointerDown(event, canvas, ctx);
      return;
    }

    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // synthetic or unsupported pointer capture
    }

    const point = this.pointFromEvent(event, canvas);
    this.drawing = true;
    this.startPoint = point;
    this.snapshot = this.captureCanvas(canvas, ctx);
    this.applyStrokeStyle(ctx);

    if (this.tool() === 'free') {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      this.strokeDot(ctx, point.x, point.y);
    }
  }

  onPointerMove(event: PointerEvent): void {
    const canvas = this.canvasRef()?.nativeElement;
    const ctx = this.ctx;
    if (!canvas || !ctx) return;

    if (this.tool() === 'line') {
      this.previewPolyline(event, canvas, ctx);
      return;
    }

    if (!this.drawing || !this.startPoint) return;

    const point = this.pointFromEvent(event, canvas);
    if (this.tool() === 'free') {
      ctx.lineTo(point.x, point.y);
      this.applyStrokeStyle(ctx);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      return;
    }

    this.restoreSnapshot(ctx);
    this.drawShape(ctx, this.startPoint, point);
  }

  onPointerUp(event: PointerEvent): void {
    if (this.tool() === 'line') return;

    const canvas = this.canvasRef()?.nativeElement;
    const ctx = this.ctx;
    try {
      if (canvas?.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    } catch {
      // ignore
    }

    if (this.drawing && this.startPoint && canvas && ctx && this.tool() !== 'free') {
      const point = this.pointFromEvent(event, canvas);
      this.restoreSnapshot(ctx);
      this.drawShape(ctx, this.startPoint, point);
    }

    this.drawing = false;
    this.startPoint = null;
    this.snapshot = null;
    this.ctx?.beginPath();
  }

  private fitCanvas(): void {
    const canvas = this.canvasRef()?.nativeElement;
    const stage = this.stageRef()?.nativeElement;
    const ctx = this.ctx;
    if (!canvas || !stage || !ctx) return;

    const rect = stage.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const cssWidth = Math.max(1, Math.floor(rect.width));
    const cssHeight = Math.max(1, Math.floor(rect.height));
    const nextWidth = Math.floor(cssWidth * dpr);
    const nextHeight = Math.floor(cssHeight * dpr);
    if (canvas.width === nextWidth && canvas.height === nextHeight) return;
    canvas.width = nextWidth;
    canvas.height = nextHeight;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    this.snapshot = null;
    this.lineAnchor = null;
    this.lineChaining.set(false);
  }

  private onLinePointerDown(
    event: PointerEvent,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
  ): void {
    const point = this.pointFromEvent(event, canvas);
    if (event.detail >= 2) {
      this.finishPolyline();
      return;
    }

    if (!this.lineAnchor) {
      this.snapshot = this.captureCanvas(canvas, ctx);
      this.lineAnchor = point;
      this.lineChaining.set(true);
      this.previewPolyline(event, canvas, ctx);
      return;
    }

    if (Math.hypot(point.x - this.lineAnchor.x, point.y - this.lineAnchor.y) < 4) {
      return;
    }

    this.restoreSnapshot(ctx);
    this.drawShape(ctx, this.lineAnchor, point);
    this.snapshot = this.captureCanvas(canvas, ctx);
    this.lineAnchor = point;
  }

  private previewPolyline(
    event: PointerEvent,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
  ): void {
    if (!this.lineAnchor) return;
    const point = this.pointFromEvent(event, canvas);
    this.restoreSnapshot(ctx);
    this.drawShape(ctx, this.lineAnchor, point);
    this.strokeDot(ctx, this.lineAnchor.x, this.lineAnchor.y);
  }

  private finishPolyline(): void {
    const ctx = this.ctx;
    if (ctx && this.snapshot && this.lineAnchor) {
      this.restoreSnapshot(ctx);
    }
    this.lineAnchor = null;
    this.snapshot = null;
    this.lineChaining.set(false);
    this.ctx?.beginPath();
  }

  private captureCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): ImageData {
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  private restoreSnapshot(ctx: CanvasRenderingContext2D): void {
    if (!this.snapshot) return;
    ctx.putImageData(this.snapshot, 0, 0);
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private drawShape(ctx: CanvasRenderingContext2D, start: DrawPoint, end: DrawPoint): void {
    this.applyStrokeStyle(ctx);
    const tool = this.tool();
    ctx.beginPath();

    if (tool === 'line') {
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      return;
    }

    const left = Math.min(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x);
    const h = Math.abs(end.y - start.y);

    if (tool === 'rect') {
      if (w < 1 && h < 1) return;
      ctx.strokeRect(left, top, Math.max(w, 1), Math.max(h, 1));
      return;
    }

    if (tool === 'ellipse') {
      const rx = w / 2;
      const ry = h / 2;
      if (rx < 0.5 && ry < 0.5) return;
      ctx.ellipse(left + rx, top + ry, Math.max(rx, 0.5), Math.max(ry, 0.5), 0, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }

    if (tool === 'circle') {
      const radius = Math.hypot(end.x - start.x, end.y - start.y);
      if (radius < 0.5) return;
      ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  private applyStrokeStyle(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = this.color();
    ctx.fillStyle = this.color();
    ctx.lineWidth = this.width();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  private pointFromEvent(event: PointerEvent, canvas: HTMLCanvasElement): DrawPoint {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  private strokeDot(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.beginPath();
    ctx.arc(x, y, this.width() / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
}
