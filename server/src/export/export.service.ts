import { Injectable, BadRequestException } from '@nestjs/common';
import { RecordsService } from '../records/records.service';
import { GameScoresService } from '../game-scores/game-scores.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExportService {
  constructor(
    private readonly recordsService: RecordsService,
    private readonly gameScoresService: GameScoresService,
  ) {}

  // ============ CSV 导出 ============

  async exportRecordsCsv(userId: number, type: string): Promise<string> {
    const records = await this.recordsService.findAll(userId, type);
    if (records.length === 0) {
      return '无数据';
    }

    const lines: string[] = [];

    switch (type) {
      case 'weight':
        lines.push('日期,体重(kg)');
        records.forEach(r => {
          const data = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
          lines.push(`${r.recordDate || r.createdAt},${data.weight || ''}`);
        });
        break;

      case 'sleep':
        lines.push('日期,入睡时间,起床时间,午睡(分钟),总睡眠(小时)');
        records.forEach(r => {
          const data = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
          lines.push(
            `${r.recordDate || r.createdAt},${data.sleepTime || ''},${data.wakeTime || ''},${data.napDuration || ''},${data.totalSleep || ''}`
          );
        });
        break;

      case 'accounting':
        lines.push('日期,金额,分类,备注');
        records.forEach(r => {
          const data = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
          const remarks = (data.remarks || '').replace(/,/g, '，');
          lines.push(
            `${r.recordDate || r.createdAt},${data.amount || ''},${data.category || ''},${remarks}`
          );
        });
        break;

      default:
        lines.push('日期,类型,数据');
        records.forEach(r => {
          const data = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
          lines.push(`${r.recordDate || r.createdAt},${r.type},${JSON.stringify(data)}`);
        });
    }

    return '\uFEFF' + lines.join('\n'); // BOM for Excel UTF-8
  }

  async exportGameScoresCsv(userId: number, game: string): Promise<string> {
    const scores = await this.gameScoresService.findAll(userId, game);
    const lines: string[] = ['日期,游戏,分数'];
    scores.forEach(s => {
      lines.push(`${s.playedAt},${s.game},${s.score}`);
    });
    return '\uFEFF' + lines.join('\n');
  }

  // ============ Excel 导出 ============

  async exportAllExcel(userId: number): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Angular20 App';
    workbook.created = new Date();

    // 体重 sheet
    const weightRecords = await this.recordsService.findAll(userId, 'weight');
    const weightSheet = workbook.addWorksheet('体重记录');
    weightSheet.columns = [
      { header: '日期', key: 'date', width: 15 },
      { header: '体重(kg)', key: 'weight', width: 12 },
    ];
    weightSheet.getRow(1).font = { bold: true };
    weightRecords.forEach(r => {
      const data = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
      weightSheet.addRow({ date: r.recordDate || r.createdAt, weight: data.weight });
    });

    // 睡眠 sheet
    const sleepRecords = await this.recordsService.findAll(userId, 'sleep');
    const sleepSheet = workbook.addWorksheet('睡眠记录');
    sleepSheet.columns = [
      { header: '日期', key: 'date', width: 15 },
      { header: '入睡时间', key: 'sleepTime', width: 12 },
      { header: '起床时间', key: 'wakeTime', width: 12 },
      { header: '午睡(分钟)', key: 'nap', width: 12 },
      { header: '总睡眠(小时)', key: 'total', width: 15 },
    ];
    sleepSheet.getRow(1).font = { bold: true };
    sleepRecords.forEach(r => {
      const data = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
      sleepSheet.addRow({
        date: r.recordDate || r.createdAt,
        sleepTime: data.sleepTime,
        wakeTime: data.wakeTime,
        nap: data.napDuration,
        total: data.totalSleep,
      });
    });

    // 记账 sheet
    const accRecords = await this.recordsService.findAll(userId, 'accounting');
    const accSheet = workbook.addWorksheet('记账记录');
    accSheet.columns = [
      { header: '日期', key: 'date', width: 15 },
      { header: '金额', key: 'amount', width: 12 },
      { header: '分类', key: 'category', width: 12 },
      { header: '备注', key: 'remarks', width: 20 },
    ];
    accSheet.getRow(1).font = { bold: true };
    accRecords.forEach(r => {
      const data = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
      accSheet.addRow({
        date: r.recordDate || r.createdAt,
        amount: data.amount,
        category: data.category,
        remarks: data.remarks,
      });
    });

    // 游戏分数 sheet
    const scores = await this.gameScoresService.findAll(userId);
    const gameSheet = workbook.addWorksheet('游戏分数');
    gameSheet.columns = [
      { header: '日期', key: 'date', width: 15 },
      { header: '游戏', key: 'game', width: 12 },
      { header: '分数', key: 'score', width: 12 },
    ];
    gameSheet.getRow(1).font = { bold: true };
    scores.forEach(s => {
      gameSheet.addRow({ date: s.playedAt, game: s.game, score: s.score });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
