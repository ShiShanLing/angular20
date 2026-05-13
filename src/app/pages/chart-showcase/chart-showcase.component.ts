import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
// 必须与 echarts-liquidfill 的 `require('echarts')`（dist 完整包）同源；默认导入在部分打包下可能是 undefined 或包在 `.default` 里
import * as echartsDistNs from 'echarts/dist/echarts.js';
import 'echarts-liquidfill/dist/echarts-liquidfill.js';
import 'echarts-gl/dist/echarts-gl.js';

type EChartsNs = typeof import('echarts');

function echartsFromDistBundle(ns: typeof echartsDistNs): EChartsNs {
  const root = ns as unknown as Record<string, unknown>;
  if (typeof root['init'] === 'function') {
    return root as unknown as EChartsNs;
  }
  const inner = root['default'] as Record<string, unknown> | undefined;
  if (inner && typeof inner['init'] === 'function') {
    return inner as unknown as EChartsNs;
  }
  throw new Error('echarts/dist/echarts.js：模块形状异常（无法取得 init），请检查打包器对 CJS 的 interop');
}

//235000 * 1.03 * 1.03 * 1.03 * 1.03 = 266266.67;
const echarts = echartsFromDistBundle(echartsDistNs);

import { GlobeEchartComponent } from './globe-echart.component';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';

/** 与浅色页面对齐：参考/轴线/主文字 */
const CARD_BG = '#ffffff';
const MUTED = '#64748b';
const TITLE_C = '#1e293b';
const AXIS_LINE = 'rgba(15, 23, 42, 0.12)';
const SPLIT_LINE = 'rgba(15, 23, 42, 0.06)';

/**
 * 炫酷图表演示：依赖完整 echarts bundle + liquidfill / gl 等扩展，
 * 汇总地球、飞线、3D、水球图等多种 option。
 */
@Component({
  selector: 'app-chart-showcase',
  standalone: true,
  imports: [
    NgxEchartsDirective,
    GlobeEchartComponent,
    NzCardModule,
    NzGridModule,
    NzIconModule,
  ],
  providers: [provideEchartsCore({ echarts })],
  templateUrl: './chart-showcase.component.html',
  styleUrl: './chart-showcase.component.scss',
})
export class ChartShowcaseComponent implements OnInit {
  private readonly http = inject(HttpClient);

  /** globe / scatter3D 等在 ECharts 核心类型里不完整，运行时为合法 option */
  globeOption: EChartsOption = {};
  neonStreamOption: EChartsOption = {};
  pulseScatterOption: EChartsOption = {};
  nightRoseOption: EChartsOption = {};
  sunburstOption: EChartsOption = {};
  forceGraphOption: EChartsOption = {};
  sankeyOption: EChartsOption = {};
  treemapOption: EChartsOption = {};
  themeRiverOption: EChartsOption = {};
  parallelCyberOption: EChartsOption = {};
  gaugeHudOption: EChartsOption = {};
  barRaceOption: EChartsOption = {};
  calendarHeatOption: EChartsOption = {};
  pictorialBarsOption: EChartsOption = {};
  liquidFillOption: EChartsOption = {};
  /** geo + lines 飞线：依赖异步拉取 GeoJSON 并 registerChinaMap */
  geoFlightLinesOption: EChartsOption = {};
  /** 省域着色 + 少量暖色 OD 弧（与飞线蓝青系区分） */
  geoProvinceHeatOption: EChartsOption = {};
  /** 直角 3D：surface 数学曲面 + bar3D 立体栅格 + scatter3D 粒子 */
  glCartesian3DOption: EChartsOption = {};

  ngOnInit(): void {
    this.glCartesian3DOption = this.buildGlCartesian3D();
    this.globeOption = this.buildGlobe();
    this.neonStreamOption = this.buildNeonStream();
    this.pulseScatterOption = this.buildPulseScatter();
    this.nightRoseOption = this.buildNightRose();
    this.sunburstOption = this.buildSunburst();
    this.forceGraphOption = this.buildForceGraph();
    this.sankeyOption = this.buildSankey();
    this.treemapOption = this.buildTreemap();
    this.themeRiverOption = this.buildThemeRiver();
    this.parallelCyberOption = this.buildParallelCyber();
    this.gaugeHudOption = this.buildGaugeHud();
    this.barRaceOption = this.buildBarRace();
    this.calendarHeatOption = this.buildCalendarHeatmap();
    this.pictorialBarsOption = this.buildPictorialBars();
    this.liquidFillOption = this.buildLiquidFill();
    this.loadChinaGeoAndFlightLines();
  }

  /** 阿里云 DataV 国界/geojson；失败时仅展示占位文案 */
  private loadChinaGeoAndFlightLines(): void {
    const url = 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json';
    this.http.get<unknown>(url).subscribe({
      next: (geo) => {
        try {
          echarts.registerMap('china', geo as never);
          this.geoFlightLinesOption = this.buildGeoFlightLines();
          this.geoProvinceHeatOption = this.buildGeoProvinceHeat(geo);
        } catch {
          const err = this.buildGeoFlightMapErrorOption('地图数据解析失败');
          this.geoFlightLinesOption = err;
          this.geoProvinceHeatOption = err;
        }
      },
      error: () => {
        const err = this.buildGeoFlightMapErrorOption(
          '地图数据加载失败（请检查网络，或改为使用本地 GeoJSON）',
        );
        this.geoFlightLinesOption = err;
        this.geoProvinceHeatOption = err;
      },
    });
  }

  private buildGeoFlightMapErrorOption(hint: string): EChartsOption {
    return {
      backgroundColor: 'transparent',
      title: {
        text: hint,
        left: 'center',
        top: 'middle',
        textStyle: { color: '#94a3b8', fontSize: 14, fontWeight: 400 },
      },
    };
  }

  private extractMapRegionNames(geo: unknown): string[] {
    const g = geo as { features?: { properties?: Record<string, unknown> | null }[] };
    const raw: string[] = [];
    for (const f of g.features ?? []) {
      const p = f.properties;
      if (!p) continue;
      const n = p['name'] ?? p['NAME'];
      if (typeof n === 'string' && n.length > 0) raw.push(n);
    }
    return [...new Set(raw)];
  }

  /**
   * 省域分级着色（map + visualMap）+ 少量暖色 OD 弧线（慢周期、pin 尾迹），与飞线卡片蓝青箭头区分。
   */
  private buildGeoProvinceHeat(geo: unknown): EChartsOption {
    const names = this.extractMapRegionNames(geo);
    const mapData = names.map((name) => ({
      name,
      value:
        28 +
        (name.split('').reduce((s, ch) => s + ch.charCodeAt(0), 0) % 72),
    }));

    const bj: [number, number] = [116.4074, 39.9042];
    const sh: [number, number] = [121.4737, 31.2304];
    const gz: [number, number] = [113.2644, 23.1291];
    const sz: [number, number] = [114.0579, 22.5431];
    const cd: [number, number] = [104.0668, 30.5728];
    const xa: [number, number] = [108.9402, 34.3416];
    const wh: [number, number] = [114.3055, 30.5928];
    const lz: [number, number] = [103.8343, 36.0611];
    const wlmq: [number, number] = [87.6168, 43.8256];
    const hb: [number, number] = [126.5358, 45.8022];
    const xm: [number, number] = [118.0894, 24.4798];

    const warmOd: {
      name: string;
      coords: [[number, number], [number, number]];
    }[] = [
      { name: '京 → 沪', coords: [bj, sh] },
      { name: '沪 → 乌', coords: [sh, wlmq] },
      { name: '穗 → 哈', coords: [gz, hb] },
      { name: '深 → 陕', coords: [sz, xa] },
      { name: '蓉 → 厦', coords: [cd, xm] },
      { name: '兰 → 鄂', coords: [lz, wh] },
      { name: '哈 → 穗', coords: [hb, gz] },
    ];

    return {
      backgroundColor: 'transparent',
      tooltip: { ...this.baseTooltip(), trigger: 'item' },
      visualMap: {
        show: true,
        min: 0,
        max: 100,
        text: ['高', '低'],
        textStyle: { color: '#cbd5e1', fontSize: 11 },
        inRange: {
          color: [
            '#1e1b4b',
            '#312e81',
            '#5b21b6',
            '#a21caf',
            '#fb7185',
            '#fcd34d',
          ],
        },
        calculable: true,
        left: 16,
        bottom: 24,
        itemWidth: 14,
        itemHeight: 118,
      },
      geo: {
        map: 'china',
        roam: true,
        zoom: 1.08,
        scaleLimit: { min: 0.82, max: 4 },
        itemStyle: {
          areaColor: '#0f172a',
          borderColor: 'rgba(148, 163, 184, 0.32)',
          borderWidth: 0.55,
        },
        emphasis: {
          label: { show: false },
        },
      },
      series: [
        {
          type: 'map',
          map: 'china',
          geoIndex: 0,
          data: mapData,
          itemStyle: {
            borderColor: 'rgba(255, 255, 255, 0.12)',
            borderWidth: 0.5,
          },
          emphasis: {
            label: { show: true, color: '#f8fafc', fontSize: 11 },
            itemStyle: {
              areaColor: '#fda4af',
              borderColor: '#fff7ed',
              borderWidth: 1,
            },
          },
        },
        {
          type: 'lines',
          coordinateSystem: 'geo',
          zlevel: 3,
          effect: {
            show: true,
            period: 11,
            trailLength: 0.38,
            symbol: 'pin',
            symbolSize: 7,
            color: 'rgba(253, 186, 116, 0.96)',
          },
          lineStyle: {
            curveness: 0.34,
            opacity: 0.72,
          },
          data: warmOd.map((d) => ({
            name: d.name,
            coords: d.coords,
            lineStyle: {
              color: '#fb923c',
              width: 2,
              opacity: 0.62,
              curveness: 0.34,
            },
          })),
        },
      ],
    } as EChartsOption;
  }

  /**
   * 2D 中国底图 + lines 流光飞线 + effectScatter 城市涟漪；与 3D 地球飞轨观感不同。
   * 需在 registerMap('china') 之后调用。
   */
  private buildGeoFlightLines(): EChartsOption {
    const bj: [number, number] = [116.4074, 39.9042];
    const cities: { name: string; coord: [number, number] }[] = [
      { name: '上海', coord: [121.4737, 31.2304] },
      { name: '广州', coord: [113.2644, 23.1291] },
      { name: '深圳', coord: [114.0579, 22.5431] },
      { name: '杭州', coord: [120.1551, 30.2741] },
      { name: '成都', coord: [104.0668, 30.5728] },
      { name: '西安', coord: [108.9402, 34.3416] },
      { name: '武汉', coord: [114.3055, 30.5928] },
      { name: '哈尔滨', coord: [126.5358, 45.8022] },
      { name: '厦门', coord: [118.0894, 24.4798] },
      { name: '昆明', coord: [102.8329, 24.8801] },
      { name: '重庆', coord: [106.5516, 29.563] },
      { name: '天津', coord: [117.2008, 39.0842] },
      { name: '南京', coord: [118.7969, 32.0603] },
      { name: '青岛', coord: [120.3826, 36.0671] },
      { name: '长沙', coord: [112.9388, 28.2282] },
      { name: '郑州', coord: [113.6254, 34.7466] },
      { name: '南宁', coord: [108.32, 22.824] },
      { name: '乌鲁木齐', coord: [87.6168, 43.8256] },
      { name: '兰州', coord: [103.8343, 36.0611] },
      { name: '太原', coord: [112.5489, 37.8706] },
      { name: '沈阳', coord: [123.4315, 41.8057] },
      { name: '长春', coord: [125.3235, 43.8171] },
      { name: '济南', coord: [117.1205, 36.6519] },
      { name: '合肥', coord: [117.2272, 31.8206] },
      { name: '南昌', coord: [115.8922, 28.6765] },
      { name: '贵阳', coord: [106.6302, 26.6477] },
    ];
    const coordOf = (name: string): [number, number] | null => {
      if (name === '北京') return bj;
      const c = cities.find((x) => x.name === name);
      return c?.coord ?? null;
    };
    const linePalette = [
      '#22d3ee',
      '#a78bfa',
      '#f472b6',
      '#34d399',
      '#fbbf24',
      '#60a5fa',
      '#fb7185',
      '#4ade80',
      '#f97316',
      '#38bdf8',
      '#c084fc',
      '#2dd4bf',
      '#fb923c',
      '#818cf8',
      '#e879f9',
      '#5eead4',
      '#fcd34d',
      '#94a3b8',
      '#f43f5e',
      '#84cc16',
    ];
    type Route = {
      from: [number, number];
      to: [number, number];
      name: string;
      color: string;
    };
    const routes: Route[] = [];
    let pi = 0;
    const pick = () => linePalette[pi++ % linePalette.length]!;
    const add = (a: string, b: string, label?: string) => {
      const from = coordOf(a);
      const to = coordOf(b);
      if (!from || !to) return;
      routes.push({
        from,
        to,
        name: label ?? `${a} → ${b}`,
        color: pick(),
      });
    };

    for (const c of cities) {
      routes.push({
        from: bj,
        to: c.coord,
        name: `北京 → ${c.name}`,
        color: pick(),
      });
    }

    const shOut = ['南京', '杭州', '合肥', '武汉', '成都', '广州', '深圳', '青岛', '厦门'];
    for (const n of shOut) add('上海', n);

    const gzOut = ['深圳', '南宁', '昆明', '武汉', '成都', '重庆', '南昌'];
    for (const n of gzOut) add('广州', n);

    const cdOut = ['重庆', '西安', '昆明', '兰州', '武汉'];
    for (const n of cdOut) add('成都', n);

    const xaOut = ['郑州', '太原', '兰州', '成都', '武汉'];
    for (const n of xaOut) add('西安', n);

    const syOut = ['长春', '哈尔滨', '北京', '济南', '青岛'];
    for (const n of syOut) add('沈阳', n);

    const meshPairs: [string, string][] = [
      ['杭州', '上海'],
      ['南京', '合肥'],
      ['济南', '青岛'],
      ['广州', '深圳'],
      ['成都', '重庆'],
      ['武汉', '长沙'],
      ['西安', '郑州'],
      ['天津', '北京'],
      ['沈阳', '北京'],
      ['上海', '厦门'],
    ];
    for (const [a, b] of meshPairs) add(a, b);

    add('深圳', '成都');
    add('乌鲁木齐', '兰州');

    const scatterPoints: { name: string; value: [number, number, number] }[] = [
      { name: '北京', value: [...bj, 120] },
      ...cities.map((c) => ({
        name: c.name,
        value: [...c.coord, 80] as [number, number, number],
      })),
    ];

    return {
      backgroundColor: 'transparent',
      tooltip: {
        ...this.baseTooltip(),
        trigger: 'item',
      },
      geo: {
        map: 'china',
        roam: true,
        scaleLimit: { min: 0.85, max: 4 },
        zoom: 1.12,
        center: [105, 35.5],
        itemStyle: {
          areaColor: '#1e293b',
          borderColor: 'rgba(148, 163, 184, 0.45)',
          borderWidth: 0.8,
          shadowColor: 'rgba(0, 0, 0, 0.35)',
          shadowBlur: 12,
        },
        emphasis: {
          disabled: false,
          itemStyle: {
            areaColor: '#334155',
            borderColor: '#94a3b8',
          },
          label: { show: false },
        },
      },
      series: [
        {
          type: 'lines',
          coordinateSystem: 'geo',
          zlevel: 2,
          polyline: false,
          effect: {
            show: true,
            period: 5.5,
            trailLength: 0.62,
            symbol: 'arrow',
            symbolSize: 5,
            color: 'rgba(103, 232, 249, 0.95)',
          },
          lineStyle: {
            curveness: 0.22,
            opacity: 0.75,
          },
          data: routes.map((r) => ({
            name: r.name,
            coords: [r.from, r.to],
            lineStyle: {
              color: r.color,
              width: 1.6,
              opacity: 0.82,
              curveness: 0.22,
            },
          })),
        },
        {
          type: 'effectScatter',
          coordinateSystem: 'geo',
          zlevel: 3,
          rippleEffect: {
            brushType: 'stroke',
            scale: 3.2,
            period: 4.5,
          },
          symbolSize: 9,
          showEffectOn: 'render',
          label: {
            show: true,
            formatter: '{b}',
            position: 'right',
            color: '#e2e8f0',
            fontSize: 11,
            distance: 6,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            padding: [2, 6],
            borderRadius: 4,
          },
          itemStyle: {
            color: '#f472b6',
            shadowBlur: 12,
            shadowColor: 'rgba(244, 114, 182, 0.45)',
          },
          data: scatterPoints,
        },
      ],
    } as EChartsOption;
  }

  /**
   * 直角坐标 3D：半透明 surface「地形」+ bar3D 立体栅格 + scatter3D 霓虹粒子；可拖拽旋转，与 globe 不同场景。
   */
  private buildGlCartesian3D(): EChartsOption {
    /**
     * bar3D 在 echarts-gl 里默认 zlevel: -10，会被压到 surface 后面，只见散点。
     * 曲面 z 取低洼「地面」、柱体 z 取高层「楼高」，避免与曲面 z-fighting。
     */
    /** 少量粗柱：易看出底面为矩形的直棱柱；间距略大于截面，留缝防穿模 */
    const barPitch = 3.04;
    const barFoot = 2.6;
    const barData: [number, number, number][] = [];
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const x = i * barPitch;
        const y = j * barPitch;
        const h =
          1.05 +
          (i + 1.5) * 0.42 +
          (j + 1.5) * 0.35 +
          Math.sin(i * j * 1.4) * 0.28;
        barData.push([x, y, h]);
      }
    }

    const scatterData: [number, number, number][] = [];
    for (let k = 0; k < 14; k++) {
      scatterData.push([
        (Math.random() - 0.5) * 2.8,
        (Math.random() - 0.5) * 2.8,
        2.35 + Math.random() * 0.85,
      ]);
    }

    const surfaceZ = (x: number, y: number): number => {
      const r = Math.sqrt(Math.max(0.02, x * x + y * y));
      return (
        Math.sin(r * 1.4) * 0.42 +
        Math.cos(x * 1.05) * Math.sin(y * 1.05) * 0.28 -
        0.72
      );
    };

    return {
      backgroundColor: 'transparent',
      tooltip: { show: false },
      xAxis3D: {
        type: 'value',
        min: -4.5,
        max: 4.5,
        name: '',
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.45)' } },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
      },
      yAxis3D: {
        type: 'value',
        min: -4.5,
        max: 4.5,
        name: '',
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.45)' } },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
      },
      zAxis3D: {
        type: 'value',
        min: -1.15,
        max: 3.45,
        name: '',
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.45)' } },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
      },
      grid3D: {
        boxWidth: 200,
        boxDepth: 200,
        boxHeight: 72,
        environment: '#020617',
        axisPointer: { show: false },
        viewControl: {
          projection: 'perspective',
          autoRotate: true,
          // 0：用户一旦拖拽/缩放，不再恢复自动旋转（默认 3s 后会重新转）
          autoRotateAfterStill: 0,
          autoRotateSpeed: 6,
          alpha: 42,
          beta: 30,
          distance: 240,
          minDistance: 130,
          maxDistance: 460,
          panSensitivity: 0,
          rotateSensitivity: 1,
          zoomSensitivity: 1.1,
          damping: 0.88,
        },
        light: {
          main: {
            intensity: 1.45,
            shadow: true,
            shadowQuality: 'high',
            alpha: 28,
            beta: 112,
          },
          ambient: { intensity: 0.32 },
        },
        postEffect: {
          enable: true,
          bloom: { enable: true, bloomIntensity: 0.12 },
          SSAO: {
            enable: true,
            quality: 'medium',
            radius: 2.8,
            intensity: 1.15,
          },
        },
        temporalSuperSampling: { enable: true },
      },
      series: [
        {
          type: 'surface',
          zlevel: -5,
          grid3DIndex: 0,
          shading: 'realistic',
          realisticMaterial: {
            roughness: 0.42,
            metalness: 0.12,
          },
          wireframe: {
            show: true,
            lineStyle: { color: 'rgba(165, 180, 252, 0.55)', width: 1.2 },
          },
          equation: {
            x: { step: 0.2, min: -4.5, max: 4.5 },
            y: { step: 0.2, min: -4.5, max: 4.5 },
            z: surfaceZ,
          },
          itemStyle: {
            // realistic 着色下用实色更稳定；明暗由光照与法线表现
            color: '#38bdf8',
            opacity: 0.93,
          },
        },
        {
          type: 'bar3D',
          zlevel: 8,
          grid3DIndex: 0,
          data: barData,
          // lambert：各立面亮度差大，直角四棱柱轮廓更清楚（无倒角时即标准长方体）
          shading: 'lambert',
          bevelSize: 0,
          bevelSmoothness: 0,
          // 略小于 barPitch，留窄缝；单值表示底面宽=深，为矩形截面
          barSize: barFoot,
          itemStyle: {
            color: '#a78bfa',
            opacity: 1,
            borderWidth: 0.6,
            borderColor: 'rgba(76, 29, 149, 0.35)',
          },
          emphasis: {
            itemStyle: { color: '#e9d5ff' },
          },
        },
        {
          type: 'scatter3D',
          zlevel: 12,
          grid3DIndex: 0,
          data: scatterData,
          symbolSize: 7,
          shading: 'lambert',
          itemStyle: {
            color: '#f472b6',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.65)',
            opacity: 0.95,
          },
        },
      ],
    } as EChartsOption;
  }

  private baseTooltip(): EChartsOption['tooltip'] {
    return {
      backgroundColor: 'rgba(255, 255, 255, 0.97)',
      borderColor: 'rgba(99, 102, 241, 0.22)',
      borderWidth: 1,
      textStyle: { color: '#334155' },
      extraCssText: 'box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);',
    };
  }

  /**
   * 3D 地球（WebGL）：拖拽旋转、滚轮缩放、自动缓慢自转；弧 Fly 线示意航线。
   * 贴图使用 Three.js 官方示例站点资源（threejs.org），避免 jsDelivr「gh 包」对部分请求返回 403。
   * 亦可改为放到 public/ 下同源引用。
   */
  private buildGlobe(): EChartsOption {
    const planets = 'https://threejs.org/examples/textures/planets';
    /** ECharts 示例同款星空；jsDelivr/gh 包易 403，raw.githubusercontent 通常可用 */
    const starfield =
      'https://raw.githubusercontent.com/apache/echarts-website/asf-site/examples/data-gl/asset/starfield.jpg';
    const cities: { name: string; lng: number; lat: number; h: number }[] = [
      { name: '北京', lng: 116.4074, lat: 39.9042, h: 3 },
      { name: '上海', lng: 121.4737, lat: 31.2304, h: 3 },
      { name: '深圳', lng: 114.0579, lat: 22.5431, h: 3 },
      { name: '东京', lng: 139.6917, lat: 35.6895, h: 3 },
      { name: '新加坡', lng: 103.8198, lat: 1.3521, h: 3 },
      { name: '悉尼', lng: 151.2093, lat: -33.8688, h: 3 },
      { name: '伦敦', lng: -0.1276, lat: 51.5074, h: 3 },
      { name: '纽约', lng: -74.006, lat: 40.7128, h: 3 },
      { name: '旧金山', lng: -122.4194, lat: 37.7749, h: 3 },
    ];
    /**
     * 城市间弧线：视觉上表示「跨国/跨洋连接」（示意，非某条真实航班航路）。
     * ECharts-GL 的 lines3D+globe 用立方贝塞尔，两端在球面、中段抬离球面；走向接近大圆方向。
     * 北京–纽约的大圆捷径在真实世界里本就偏北（常经北极附近区域），弧顶朝北是合理的大致方向。
     */
    const arcs = [
      [[116.4074, 39.9042], [-74.006, 40.7128]],
      [[121.4737, 31.2304], [-122.4194, 37.7749]],
      [[114.0579, 22.5431], [103.8198, 1.3521]],
      [[139.6917, 35.6895], [151.2093, -33.8688]],
      [[-0.1276, 51.5074], [139.6917, 35.6895]],
    ] as [number, number][][];

    /**
     * 日月与河外星系：ECharts globe 的高度轴只能映射到 globeOuterRadius 以内，无法按真实天文距离，
     * 此处为「天球壳」上的视觉示意；方位为大致示意，非某时刻真实地平坐标。
     */
    const shell = { sun: 54, moon: 49 };
    const celestialLabel = {
      show: true,
      formatter: '{b}',
      color: '#f8fafc',
      fontSize: 11,
      backgroundColor: 'rgba(15, 23, 42, 0.55)',
      padding: [2, 6],
      borderRadius: 4,
      distance: 4,
    };
    const deepSkyGalaxies: {
      name: string;
      lng: number;
      lat: number;
      alt: number;
      symbol: string;
      size: number;
      color: string;
      showLabel: boolean;
    }[] = [
      { name: '仙女座星系 M31', lng: -132, lat: 48, alt: 51, symbol: 'diamond', size: 12, color: '#e9d5ff', showLabel: true },
      { name: '三角座星系 M33', lng: 28, lat: 32, alt: 48, symbol: 'diamond', size: 10, color: '#c4b5fd', showLabel: true },
      { name: '涡旋星系 M51', lng: 168, lat: 58, alt: 45, symbol: 'diamond', size: 10, color: '#a5b4fc', showLabel: false },
      { name: '风车星系 M101', lng: -42, lat: 56, alt: 47, symbol: 'diamond', size: 9, color: '#93c5fd', showLabel: false },
      { name: '草帽星系 M104', lng: -118, lat: -22, alt: 46, symbol: 'diamond', size: 9, color: '#7dd3fc', showLabel: false },
      { name: '室女座 A M87', lng: -76, lat: 10, alt: 50, symbol: 'circle', size: 8, color: '#fecdd3', showLabel: true },
      { name: '大麦哲伦云', lng: 98, lat: -66, alt: 44, symbol: 'diamond', size: 11, color: '#fbcfe8', showLabel: true },
      { name: '小麦哲伦云', lng: 52, lat: -70, alt: 43, symbol: 'diamond', size: 9, color: '#f9a8d4', showLabel: false },
      { name: '触须星系 NGC 4038', lng: 44, lat: -38, alt: 44, symbol: 'diamond', size: 8, color: '#fcd34d', showLabel: false },
      { name: '车轮星系', lng: -92, lat: -30, alt: 42, symbol: 'diamond', size: 8, color: '#fde68a', showLabel: false },
      { name: '黑眼星系 M64', lng: 174, lat: 22, alt: 43, symbol: 'diamond', size: 7, color: '#d8b4fe', showLabel: false },
      { name: '猎户座大星云 M42', lng: 82, lat: -28, alt: 46, symbol: 'diamond', size: 9, color: '#99f6e4', showLabel: false },
    ];

    return {
      backgroundColor: 'transparent',
      globe: {
        show: true,
        // 略放大天球壳，让日月/星系散点离地表稍远，仍与数据高度轴同一套比例
        globeOuterRadius: 172,
        // day 贴图才能看清海陆轮廓；atmos 以云为主，在此场景下会像灰球
        baseTexture: `${planets}/earth_day_4096.jpg`,
        // 高度/位移贴图与底图在 0°/360° 经线会有接缝，顶点位移易在该子午线（北极—南极一条线）上与自身或大气产生 Z-fighting 闪烁
        heightTexture: '',
        displacementScale: 0,
        shading: 'lambert',
        environment: starfield,
        light: {
          ambient: { intensity: 0.65 },
          main: { intensity: 0.95, shadow: false },
        },
        // 滚轮缩放 + 拖拽旋转即可「拉近」看城市散点；无需地图插件。再放大受贴图分辨率限制，无街道级细节。
        viewControl: {
          autoRotate: true,
          autoRotateAfterStill: 0,
          autoRotateSpeed: 6,
          damping: 0.88,
          rotateSensitivity: 1,
          zoomSensitivity: 1.35,
          panSensitivity: 0,
          distance: 210,
          minDistance: 68,
          maxDistance: 420,
        },
        layers: [
          {
            type: 'blend',
            blendTo: 'emission',
            texture: `${planets}/earth_lights_2048.png`,
            intensity: 1.35,
          },
        ],
        postEffect: {
          enable: true,
          bloom: { enable: true, bloomIntensity: 0.1 },
          SSAO: { enable: false },
        },
        temporalSuperSampling: { enable: true },
        atmosphere: { show: true, offset: 6, color: '#6fa8ff', glowPower: 6 },
      },
      tooltip: {
        ...this.baseTooltip(),
        show: true,
      },
      series: [
        {
          type: 'scatter3D',
          name: '城市',
          coordinateSystem: 'globe',
          blendMode: 'lighter',
          symbolSize: 14,
          itemStyle: { color: '#f472b6', opacity: 0.95 },
          label: {
            show: true,
            formatter: '{b}',
            position: 'top',
            distance: 2,
            color: '#f1f5f9',
            fontSize: 11,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            padding: [2, 6],
            borderRadius: 4,
          },
          data: cities.map((c) => ({
            name: c.name,
            value: [c.lng, c.lat, c.h],
          })),
        },
        {
          type: 'lines3D',
          name: '航线示意',
          coordinateSystem: 'globe',
          blendMode: 'lighter',
          effect: {
            show: true,
            trailWidth: 3,
            trailLength: 0.18,
            trailColor: '#67e8f9',
            trailOpacity: 0.85,
            constantSpeed: 22,
          },
          lineStyle: {
            width: 1.2,
            color: 'rgba(103, 232, 249, 0.35)',
            opacity: 0.45,
          },
          data: arcs.map((coords) => ({ coords })),
        },
        {
          type: 'scatter3D',
          name: '河外星系（示意）',
          coordinateSystem: 'globe',
          blendMode: 'lighter',
          data: deepSkyGalaxies.map((g) => ({
            name: g.name,
            value: [g.lng, g.lat, g.alt],
            symbol: g.symbol,
            symbolSize: g.size,
            itemStyle: {
              color: g.color,
              opacity: 0.92,
              borderColor: 'rgba(255,255,255,0.35)',
              borderWidth: 1,
            },
            label: { ...celestialLabel, show: g.showLabel },
          })),
        },
        {
          type: 'scatter3D',
          name: '太阳与月球（示意）',
          coordinateSystem: 'globe',
          blendMode: 'lighter',
          data: [
            {
              name: '太阳（示意）',
              value: [92, 8, shell.sun],
              symbol: 'circle',
              symbolSize: 40,
              itemStyle: {
                color: '#ffcc33',
                opacity: 1,
                borderColor: 'rgba(255, 230, 150, 0.75)',
                borderWidth: 2,
              },
              label: celestialLabel,
            },
            {
              name: '月球（示意）',
              value: [-58, 20, shell.moon],
              symbol: 'circle',
              symbolSize: 16,
              itemStyle: {
                color: '#e8eef7',
                opacity: 0.96,
                borderColor: 'rgba(200, 210, 230, 0.5)',
                borderWidth: 1,
              },
              label: celestialLabel,
            },
          ],
        },
      ],
    } as EChartsOption;
  }

  /** 霓虹流线：渐变面积 + 强发光描边 */
  private buildNeonStream(): EChartsOption {
    const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
    const wave = (phase: number, amp: number) =>
      hours.map((_, i) =>
        Math.round(48 + amp * Math.sin((i / 24) * Math.PI * 2 + phase) + (Math.random() - 0.5) * 6)
      );

    return {
      backgroundColor: 'transparent',
      tooltip: { ...this.baseTooltip(), trigger: 'axis' },
      legend: {
        data: ['吞吐', '延迟(反比)', '错误率×10'],
        textStyle: { color: MUTED },
        top: 8,
      },
      grid: { left: '2%', right: '3%', bottom: '2%', top: 56, containLabel: true },
      xAxis: {
        type: 'category',
        data: hours,
        axisLine: { lineStyle: { color: AXIS_LINE } },
        axisLabel: { color: MUTED, fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: SPLIT_LINE } },
        axisLabel: { color: MUTED },
      },
      series: [
        {
          name: '吞吐',
          type: 'line',
          smooth: 0.42,
          showSymbol: false,
          data: wave(0, 22),
          lineStyle: { width: 3, color: '#22d3ee', shadowBlur: 18, shadowColor: 'rgba(34, 211, 238, 0.85)' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(34, 211, 238, 0.45)' },
                { offset: 1, color: 'rgba(34, 211, 238, 0)' },
              ],
            },
          },
        },
        {
          name: '延迟(反比)',
          type: 'line',
          smooth: 0.42,
          showSymbol: false,
          data: wave(1.2, 18),
          lineStyle: { width: 3, color: '#a78bfa', shadowBlur: 18, shadowColor: 'rgba(167, 139, 250, 0.85)' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(167, 139, 250, 0.4)' },
                { offset: 1, color: 'rgba(167, 139, 250, 0)' },
              ],
            },
          },
        },
        {
          name: '错误率×10',
          type: 'line',
          smooth: 0.42,
          showSymbol: false,
          data: wave(2.4, 12).map((v) => Math.max(15, v - 15)),
          lineStyle: { width: 2, color: '#f472b6', shadowBlur: 14, shadowColor: 'rgba(244, 114, 182, 0.75)' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(244, 114, 182, 0.35)' },
                { offset: 1, color: 'rgba(244, 114, 182, 0)' },
              ],
            },
          },
        },
      ],
    };
  }

  /** 涟漪散点 */
  private buildPulseScatter(): EChartsOption {
    const data: [number, number, number][] = [];
    for (let i = 0; i < 45; i++) {
      data.push([
        +(Math.random() * 100).toFixed(2),
        +(Math.random() * 80 + 10).toFixed(2),
        Math.round(Math.random() * 28 + 12),
      ]);
    }
    return {
      backgroundColor: 'transparent',
      tooltip: this.baseTooltip(),
      grid: { left: '6%', right: '5%', bottom: '8%', top: 48 },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: SPLIT_LINE } },
        axisLabel: { color: MUTED },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: SPLIT_LINE } },
        axisLabel: { color: MUTED },
      },
      visualMap: {
        show: false,
        min: 12,
        max: 40,
        dimension: 2,
        inRange: { color: ['#06b6d4', '#8b5cf6', '#ec4899'] },
      },
      series: [
        {
          type: 'effectScatter',
          data,
          symbolSize: (val: number[]) => val[2],
          rippleEffect: { brushType: 'stroke', scale: 4.2, period: 5 },
          itemStyle: { opacity: 0.92, shadowBlur: 12, shadowColor: 'rgba(236, 72, 153, 0.45)' },
        },
      ],
    };
  }

  /** 南丁格尔玫瑰 */
  private buildNightRose(): EChartsOption {
    const data = [
      { name: 'Angular', value: 38 },
      { name: 'React', value: 32 },
      { name: 'Vue', value: 26 },
      { name: 'Svelte', value: 14 },
      { name: 'Solid', value: 12 },
      { name: '其他', value: 18 },
    ];
    return {
      backgroundColor: 'transparent',
      tooltip: { ...this.baseTooltip(), trigger: 'item' },
      legend: { bottom: 4, textStyle: { color: MUTED }, type: 'scroll' },
      series: [
        {
          name: '生态热度(示意)',
          type: 'pie',
          radius: ['18%', '72%'],
          center: ['50%', '46%'],
          roseType: 'area',
          itemStyle: { borderRadius: 8, borderColor: CARD_BG, borderWidth: 2 },
          label: { color: TITLE_C },
          data: data.map((d, i) => ({
            ...d,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 1,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: ['#22d3ee', '#a78bfa', '#f472b6', '#fbbf24', '#34d399', '#60a5fa'][i % 6],
                  },
                  { offset: 1, color: '#c7d2fe' },
                ],
              },
            },
          })),
        },
      ],
    };
  }

  /** 旭日图 */
  private buildSunburst(): EChartsOption {
    return {
      backgroundColor: 'transparent',
      tooltip: this.baseTooltip(),
      series: [
        {
          type: 'sunburst',
          data: [
            {
              name: '移动端',
              itemStyle: { color: '#0e7490' },
              children: [
              { name: 'iOS', value: 42, itemStyle: { color: '#06b6d4' } },
              { name: 'Android', value: 48, itemStyle: { color: '#0891b2' } },
              { name: '跨端', value: 22, itemStyle: { color: '#22d3ee' } },
              ],
            },
            {
              name: '前端',
              itemStyle: { color: '#5b21b6' },
              children: [
                {
                  name: 'Angular',
                  value: 35,
                  itemStyle: { color: '#7c3aed' },
                  children: [
                    { name: 'Signals', value: 12 },
                    { name: 'RxJS', value: 14 },
                    { name: 'CD', value: 9 },
                  ],
                },
                { name: '工具链', value: 20, itemStyle: { color: '#8b5cf6' } },
                { name: '样式', value: 18, itemStyle: { color: '#a78bfa' } },
              ],
            },
            {
              name: '服务端',
              itemStyle: { color: '#831843' },
              children: [
                { name: 'Node', value: 24, itemStyle: { color: '#ec4899' } },
                { name: '网关', value: 16, itemStyle: { color: '#f472b6' } },
              ],
            },
          ],
          radius: [0, '92%'],
          sort: undefined,
          emphasis: { focus: 'ancestor' },
          levels: [
            {},
            {
              r0: '10%',
              r: '35%',
              itemStyle: { borderWidth: 2, borderColor: CARD_BG },
              label: { rotate: 'tangential' },
            },
            { r0: '35%', r: '62%', label: { align: 'right' } },
            {
              r0: '62%',
              r: '92%',
              label: { position: 'outside', silent: false, color: MUTED },
              itemStyle: { borderWidth: 1, borderColor: CARD_BG },
            },
          ],
        },
      ],
    };
  }

  /** 力导向关系图 */
  private buildForceGraph(): EChartsOption {
    const cats = [
      { name: '核心', itemStyle: { color: '#22d3ee' } },
      { name: '构建', itemStyle: { color: '#a78bfa' } },
      { name: '质量', itemStyle: { color: '#f472b6' } },
      { name: '数据', itemStyle: { color: '#fbbf24' } },
    ];
    const nodes = [
      { id: 'ng', name: 'Angular', symbolSize: 56, category: 0 },
      { id: 'cli', name: 'CLI', symbolSize: 36, category: 1 },
      { id: 'vitest', name: 'Vitest', symbolSize: 32, category: 2 },
      { id: 'nx', name: 'Nx', symbolSize: 34, category: 1 },
      { id: 'rxjs', name: 'RxJS', symbolSize: 40, category: 3 },
      { id: 'zone', name: 'Zone.js', symbolSize: 30, category: 3 },
      { id: 'esbuild', name: 'esbuild', symbolSize: 28, category: 1 },
      { id: 'eslint', name: 'ESLint', symbolSize: 28, category: 2 },
    ];
    const links = [
      { source: 'ng', target: 'cli' },
      { source: 'ng', target: 'rxjs' },
      { source: 'ng', target: 'zone' },
      { source: 'cli', target: 'esbuild' },
      { source: 'cli', target: 'nx' },
      { source: 'ng', target: 'vitest' },
      { source: 'ng', target: 'eslint' },
      { source: 'nx', target: 'eslint' },
      { source: 'vitest', target: 'esbuild' },
    ];
    return {
      backgroundColor: 'transparent',
      tooltip: this.baseTooltip(),
      legend: {
        data: cats.map((c) => c.name),
        textStyle: { color: MUTED },
        bottom: 0,
      },
      series: [
        {
          type: 'graph',
          layout: 'force',
          roam: true,
          draggable: true,
          force: { repulsion: 420, edgeLength: [64, 140] },
          categories: cats,
          data: nodes,
          links,
          label: { show: true, position: 'inside', color: '#0c0a09', fontWeight: 600, fontSize: 11 },
          lineStyle: { color: 'source', curveness: 0.22, width: 2, opacity: 0.85 },
          emphasis: { focus: 'adjacency', lineStyle: { width: 4 } },
        },
      ],
    };
  }

  /** 桑基图 */
  private buildSankey(): EChartsOption {
    return {
      backgroundColor: 'transparent',
      tooltip: this.baseTooltip(),
      series: [
        {
          type: 'sankey',
          left: '4%',
          right: '6%',
          top: '6%',
          bottom: '6%',
          emphasis: { focus: 'adjacency' },
          nodeAlign: 'justify',
          layoutIterations: 32,
          lineStyle: { color: 'gradient', curveness: 0.52, opacity: 0.55 },
          itemStyle: { borderWidth: 0 },
          label: { color: TITLE_C, fontSize: 12, fontWeight: 500 },
          data: [
            { name: '用户请求', itemStyle: { color: '#22d3ee' } },
            { name: 'CDN', itemStyle: { color: '#38bdf8' } },
            { name: '静态资源', itemStyle: { color: '#0ea5e9' } },
            { name: '网关', itemStyle: { color: '#818cf8' } },
            { name: 'BFF', itemStyle: { color: '#a78bfa' } },
            { name: '微服务 A', itemStyle: { color: '#f472b6' } },
            { name: '微服务 B', itemStyle: { color: '#fb7185' } },
            { name: '缓存', itemStyle: { color: '#fbbf24' } },
            { name: 'DB', itemStyle: { color: '#34d399' } },
          ],
          links: [
            { source: '用户请求', target: 'CDN', value: 35 },
            { source: '用户请求', target: '网关', value: 65 },
            { source: 'CDN', target: '静态资源', value: 35 },
            { source: '网关', target: 'BFF', value: 40 },
            { source: '网关', target: '微服务 A', value: 25 },
            { source: 'BFF', target: '微服务 A', value: 15 },
            { source: 'BFF', target: '微服务 B', value: 25 },
            { source: '微服务 A', target: '缓存', value: 20 },
            { source: '微服务 A', target: 'DB', value: 20 },
            { source: '微服务 B', target: 'DB', value: 25 },
          ],
        },
      ],
    };
  }

  private buildTreemap(): EChartsOption {
    return {
      backgroundColor: 'transparent',
      tooltip: this.baseTooltip(),
      series: [
        {
          type: 'treemap',
          roam: false,
          nodeClick: 'zoomToNode',
          breadcrumb: { show: true, height: 26, emptyItemWidth: 18, itemStyle: { color: MUTED } },
          left: '2%',
          right: '2%',
          top: 8,
          bottom: 8,
          label: { show: true, formatter: '{b}', color: '#fff', fontSize: 13, fontWeight: 600 },
          upperLabel: { show: true, height: 24, color: '#fff' },
          itemStyle: { borderColor: CARD_BG, borderWidth: 2, gapWidth: 2, borderRadius: 6 },
          levels: [
            { itemStyle: { borderWidth: 3 } },
            { colorSaturation: [0.45, 0.65], itemStyle: { borderWidth: 2, gapWidth: 2 } },
          ],
          data: [
            {
              name: '体验',
              value: 180,
              children: [
                { name: 'FPS', value: 55 },
                { name: '首屏', value: 62 },
                { name: '交互', value: 63 },
              ],
            },
            {
              name: '稳定',
              value: 220,
              children: [
                { name: '可用性', value: 95 },
                { name: '错误率', value: 68 },
                { name: '回滚', value: 57 },
              ],
            },
            {
              name: '交付',
              value: 160,
              children: [
                { name: '构建', value: 52 },
                { name: '测试', value: 48 },
                { name: '发布', value: 60 },
              ],
            },
          ],
        },
      ],
    };
  }

  /** 主题河流：多条带状流叠成河，适合做时间×品类占比流 */
  private buildThemeRiver(): EChartsOption {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const streams = ['渲染', '脚本', '空闲', '网络', 'GPU', '布局'];
    // 首维必须是可与 +val 转成数的类目下标；中文会变为 NaN，Single#dataToPoint 无法布局，图会空白
    const data: [number, number, string][] = [];
    streams.forEach((name, si) => {
      let v = 12 + si * 5;
      days.forEach((_, di) => {
        v += (Math.sin((si + 1) * 0.9 + v * 0.07) + 1.1) * (5 + si);
        data.push([di, Math.max(8, Math.round(v % 120) + 15), name]);
      });
    });
    return {
      backgroundColor: 'transparent',
      tooltip: {
        ...this.baseTooltip(),
        trigger: 'axis',
        axisPointer: { type: 'line' },
        formatter: (params: unknown) => {
          const list = (Array.isArray(params) ? params : [params]) as {
            axisValue?: string | number;
            marker?: string;
            seriesName?: string;
            value?: number;
          }[];
          if (!list.length) return '';
          const ax = list[0].axisValue;
          let day: string;
          if (typeof ax === 'number' && days[ax]) day = days[ax];
          else if (typeof ax === 'string' && days.includes(ax)) day = ax;
          else {
            const i = Number.parseInt(String(ax), 10);
            day = Number.isFinite(i) && days[i] ? days[i] : String(ax ?? '');
          }
          const body = list
            .map((p) => `${p.marker ?? ''}${p.seriesName ?? ''}：${p.value ?? ''}`)
            .join('<br/>');
          return `<strong>${day}</strong><br/>${body}`;
        },
      },
      singleAxis: {
        orient: 'horizontal',
        top: 48,
        bottom: 36,
        left: '2%',
        right: '2%',
        type: 'category',
        boundaryGap: true,
        data: days,
        axisLabel: { color: MUTED, fontWeight: 500 },
        axisLine: { lineStyle: { color: AXIS_LINE } },
      },
      series: [
        {
          type: 'themeRiver',
          data,
          label: { show: true, color: '#f8fafc', fontSize: 11, fontWeight: 600 },
        },
      ],
    };
  }

  /** 平行坐标：多维连线「扫描」感，适合多维对比/ profiling */
  private buildParallelCyber(): EChartsOption {
    const dims = ['QPS', 'P99 ms', 'CPU %', '内存 MB', '错误/分'];
    const raw: number[][] = [];
    for (let i = 0; i < 42; i++) {
      raw.push([
        200 + Math.round(Math.random() * 4200),
        12 + Math.round(Math.random() * 180),
        Math.round(Math.random() * 92),
        128 + Math.round(Math.random() * 1800),
        Math.round(Math.random() * 14),
      ]);
    }
    return {
      backgroundColor: 'transparent',
      tooltip: this.baseTooltip(),
      visualMap: {
        show: false,
        type: 'continuous',
        dimension: 2,
        min: 0,
        max: 95,
        inRange: { color: ['#22d3ee', '#6366f1', '#c084fc', '#fb7185'] },
      },
      parallelAxis: dims.map((name, dim) => ({
        dim,
        name,
        nameTextStyle: { color: TITLE_C, fontSize: 11, fontWeight: 600 },
        axisLine: { lineStyle: { color: AXIS_LINE, width: 1.5 } },
        axisTick: { lineStyle: { color: SPLIT_LINE } },
        splitLine: { show: true, lineStyle: { color: SPLIT_LINE } },
      })),
      parallel: {
        left: 28,
        right: 28,
        top: 44,
        bottom: 28,
        parallelAxisDefault: {
          nameLocation: 'end',
          nameGap: 8,
        },
      },
      series: [
        {
          type: 'parallel',
          smooth: true,
          lineStyle: { width: 1.35, opacity: 0.38 },
          emphasis: { lineStyle: { width: 3.5, opacity: 0.95 } },
          data: raw,
        },
      ],
    };
  }

  /** 三联 HUD 仪表盘：progress + roundCap，偏控制台/Vision 风格 */
  private buildGaugeHud(): EChartsOption {
    const mk = (
      center: [string, string],
      title: string,
      value: number,
      track: string,
      bar: string
    ) => ({
      type: 'gauge' as const,
      center,
      radius: '58%',
      startAngle: 208,
      endAngle: -28,
      min: 0,
      max: 100,
      progress: {
        show: true,
        width: 13,
        roundCap: true,
        itemStyle: { color: bar, shadowBlur: 14, shadowColor: `${bar}66` },
      },
      axisLine: {
        roundCap: true,
        lineStyle: { width: 13, color: [[1, track]] as [number, string][] },
      },
      pointer: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      title: { offsetCenter: [0, '70%'], color: MUTED, fontSize: 11 },
      detail: {
        valueAnimation: true,
        offsetCenter: [0, '6%'],
        formatter: '{value}%',
        color: TITLE_C,
        fontSize: 21,
        fontWeight: 700,
      },
      data: [{ value, name: title }],
    });

    return {
      backgroundColor: 'transparent',
      tooltip: this.baseTooltip(),
      series: [
        mk(['18%', '54%'], '健康度', 78, 'rgba(15, 23, 42, 0.06)', '#2dd4bf'),
        mk(['50%', '54%'], '饱和度', 63, 'rgba(15, 23, 42, 0.06)', '#818cf8'),
        mk(['82%', '54%'], '稳定性', 86, 'rgba(15, 23, 42, 0.06)', '#fb923c'),
      ],
    };
  }

  /** 柱状排序竞速：timeline + bar.realtimeSort，按「赛季」播放示意热度榜 */
  private buildBarRace(): EChartsOption {
    const frameworks = ['Angular', 'React', 'Vue', 'Svelte', 'Solid', 'Qwik', 'Next', 'Nuxt'];
    const colors: Record<string, string> = {
      Angular: '#dd0031',
      React: '#149eca',
      Vue: '#42b883',
      Svelte: '#ff3e00',
      Solid: '#446b9e',
      Qwik: '#18b6f6',
      Next: '#0ea5e9',
      Nuxt: '#00dc82',
    };
    const seasons = ['2024 Q1', '2024 Q2', '2024 Q3', '2024 Q4', '2025 Q1', '2025 Q2', '2025 Q3', '2025 Q4'];
    const options = seasons.map((label, si) => {
      const items = frameworks.map((name, i) => ({
        name,
        value: Math.max(
          14,
          Math.round(
            32 +
              i * 9 +
              si * (4 + (i % 4)) +
              Math.sin((si + i) * 0.65) * 24 +
              Math.random() * 26
          )
        ),
      }));
      items.sort((a, b) => b.value - a.value);
      return {
        title: {
          text: `${label} · 框架热度指数（示意）`,
          left: 'center',
          top: 2,
          textStyle: { fontSize: 15, fontWeight: 600, color: TITLE_C },
        },
        yAxis: { data: items.map((d) => d.name) },
        series: [
          {
            type: 'bar' as const,
            realtimeSort: true,
            data: items.map((d) => ({
              value: d.value,
              itemStyle: {
                color: colors[d.name] ?? '#6366f1',
                borderRadius: [0, 6, 6, 0],
              },
            })),
          },
        ],
      };
    });

    return {
      backgroundColor: 'transparent',
      baseOption: {
        timeline: {
          axisType: 'category',
          autoPlay: true,
          rewind: true,
          playInterval: 1050,
          data: seasons,
          label: { color: MUTED },
          lineStyle: { color: AXIS_LINE },
          itemStyle: { color: '#818cf8' },
          checkpointStyle: { borderColor: '#6366f1', color: '#eef2ff' },
          controlStyle: { color: MUTED, borderColor: AXIS_LINE },
          bottom: 4,
          left: 40,
          right: 40,
          height: 54,
        },
        tooltip: {
          ...this.baseTooltip(),
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
        },
        grid: { left: 102, right: 44, top: 44, bottom: 78, containLabel: false },
        xAxis: {
          type: 'value',
          max: 'dataMax',
          splitLine: { lineStyle: { color: SPLIT_LINE } },
          axisLabel: { color: MUTED },
        },
        yAxis: {
          type: 'category',
          inverse: true,
          animationDuration: 280,
          animationDurationUpdate: 280,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: TITLE_C, fontWeight: 600, fontSize: 12 },
        },
        series: [
          {
            type: 'bar',
            realtimeSort: true,
            label: {
              show: true,
              position: 'right',
              color: MUTED,
              formatter: '{c}',
              fontWeight: 600,
            },
            barCategoryGap: '18%',
          },
        ],
      },
      options,
    } as EChartsOption;
  }

  /** 日历热力图：calendar + heatmap，示意全年提交/活跃强度 */
  private buildCalendarHeatmap(): EChartsOption {
    const year = 2026;
    const data: [string, number][] = [];
    const start = new Date(year, 0, 1).getTime();
    const end = new Date(year + 1, 0, 1).getTime();
    for (let t = start; t < end; t += 86400000) {
      const d = new Date(t);
      const iso = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const weekend = d.getDay() === 0 || d.getDay() === 6 ? 5 : 0;
      data.push([iso, Math.round(weekend + Math.random() * 14 + (d.getMonth() % 4) * 2)]);
    }

    return {
      backgroundColor: 'transparent',
      tooltip: {
        ...this.baseTooltip(),
        formatter: (p: unknown) => {
          const x = p as { data?: [string, number] };
          const pair = x.data;
          return pair ? `${pair[0]} · ${pair[1]}（示意）` : '';
        },
      },
      visualMap: {
        min: 0,
        max: 24,
        type: 'continuous',
        orient: 'horizontal',
        left: 'center',
        bottom: 4,
        itemWidth: 12,
        itemHeight: 120,
        text: ['高', '低'],
        textStyle: { color: MUTED, fontSize: 11 },
        inRange: { color: ['#eef2ff', '#a5b4fc', '#6366f1', '#3730a3'] },
        calculable: true,
      },
      calendar: {
        top: 52,
        left: 40,
        right: 28,
        cellSize: [12, 12],
        range: String(year),
        splitLine: { lineStyle: { color: AXIS_LINE, width: 0.5 } },
        itemStyle: { borderWidth: 1.5, borderColor: CARD_BG, borderRadius: 2 },
        yearLabel: { show: true, color: TITLE_C, fontWeight: 700, fontSize: 14 },
        monthLabel: { color: MUTED, nameMap: 'ZH' as const },
        dayLabel: {
          firstDay: 1,
          nameMap: ['日', '一', '二', '三', '四', '五', '六'],
          color: MUTED,
          fontSize: 10,
        },
      },
      series: [
        {
          type: 'heatmap',
          coordinateSystem: 'calendar',
          data,
        },
      ],
    };
  }

  /** 象形柱图：pictorialBar，底层满格 + 上层 repeat 符号堆叠高度 */
  private buildPictorialBars(): EChartsOption {
    const cats = ['构建', '单测', 'E2E', '部署', '观测'];
    const vals = [78, 92, 64, 88, 71];
    const max = 100;
    return {
      backgroundColor: 'transparent',
      tooltip: { ...this.baseTooltip(), trigger: 'axis' },
      legend: {
        data: ['完成度'],
        textStyle: { color: MUTED },
        top: 0,
        right: 8,
      },
      grid: { left: 8, right: 16, top: 36, bottom: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: cats,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: AXIS_LINE } },
        axisLabel: { color: MUTED, fontWeight: 500 },
      },
      yAxis: {
        type: 'value',
        max,
        splitLine: { lineStyle: { color: SPLIT_LINE } },
        axisLabel: { color: MUTED, formatter: '{value}%' },
      },
      series: [
        {
          name: '满格',
          type: 'pictorialBar',
          silent: true,
          z: 0,
          symbol: 'roundRect',
          symbolRepeat: 'fixed',
          symbolSize: [26, 5],
          symbolMargin: '22%',
          symbolBoundingData: max,
          itemStyle: { color: 'rgba(15, 23, 42, 0.05)', borderRadius: 2 },
          data: vals.map(() => max),
        },
        {
          name: '完成度',
          type: 'pictorialBar',
          z: 1,
          symbol:
            'path://M0,10 L10,10 C5.5,10 5.5,5 5,0 C2.5,5 2.5,10 0,10 z',
          symbolRepeat: true,
          symbolSize: [20, 8],
          symbolMargin: '12%',
          symbolBoundingData: max,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#a5b4fc' },
              { offset: 1, color: '#6366f1' },
            ]),
          },
          data: vals,
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#67e8f9' },
                { offset: 1, color: '#4f46e5' },
              ]),
            },
          },
        },
      ],
    };
  }

  /** 水球图：echarts-liquidfill 插件；双球示意完成度 / 稳定性 */
  private buildLiquidFill(): EChartsOption {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        ...this.baseTooltip(),
        formatter: (p: unknown) => {
          const x = p as { seriesName?: string; value?: number };
          const v = x.value;
          return v != null
            ? `${x.seriesName ?? ''}：${Math.round(Number(v) * 100)}%（示意）`
            : '';
        },
      },
      series: [
        {
          type: 'liquidFill',
          name: '交付健康度',
          center: ['26%', '52%'],
          radius: '38%',
          data: [0.72, 0.64, 0.56],
          color: ['#22d3ee', '#38bdf8', '#a5f3fc'],
          amplitude: 7,
          waveLength: '78%',
          phase: 3,
          period: 4200,
          outline: {
            show: true,
            borderDistance: 5,
            itemStyle: {
              borderWidth: 2.5,
              borderColor: '#0891b2',
              shadowBlur: 8,
              shadowColor: 'rgba(8, 145, 178, 0.35)',
            },
          },
          label: {
            formatter: '72%',
            fontSize: 19,
            fontWeight: 700,
            color: TITLE_C,
            insideColor: '#fff',
          },
          backgroundStyle: { color: 'rgba(236, 254, 255, 0.55)' },
        },
        {
          type: 'liquidFill',
          name: '线上稳定度',
          center: ['74%', '52%'],
          radius: '38%',
          data: [0.58, 0.5, 0.44],
          color: ['#818cf8', '#a5b4fc', '#c4b5fd'],
          amplitude: 6,
          waveLength: '82%',
          period: 5000,
          outline: {
            show: true,
            borderDistance: 5,
            itemStyle: { borderWidth: 2.5, borderColor: '#6366f1' },
          },
          label: {
            formatter: '58%',
            fontSize: 19,
            fontWeight: 700,
            color: TITLE_C,
            insideColor: '#fff',
          },
          backgroundStyle: { color: 'rgba(238, 242, 255, 0.65)' },
        },
      ],
    } as EChartsOption;
  }
}
