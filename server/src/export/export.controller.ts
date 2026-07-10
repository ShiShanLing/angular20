import { Controller, Get, Query, UseGuards, Request, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { ExportService } from './export.service';
import { Response } from 'express';

@ApiTags('export')
@ApiBearerAuth()
@Controller('export')
@UseGuards(AuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('records/csv')
  @ApiOperation({ summary: '导出记录为 CSV', description: '按类型导出记录为 CSV 文件（UTF-8 BOM）' })
  @ApiQuery({ name: 'type', required: true, description: '类型: weight / sleep / accounting' })
  async exportRecordsCsv(
    @Request() req: any,
    @Res() res: Response,
    @Query('type') type: string,
  ) {
    if (!type) {
      return res.status(400).json({ message: '请指定 type 参数' });
    }
    const csv = await this.exportService.exportRecordsCsv(req.user.userId, type);
    const filename = encodeURIComponent(`${type}_${this.dateStr()}.csv`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
    return res.send(csv);
  }

  @Get('game-scores/csv')
  @ApiOperation({ summary: '导出游戏分数为 CSV' })
  @ApiQuery({ name: 'game', required: false, description: '游戏: snake / tetris（不填导出全部）' })
  async exportGameScoresCsv(
    @Request() req: any,
    @Res() res: Response,
    @Query('game') game: string,
  ) {
    const csv = await this.exportService.exportGameScoresCsv(req.user.userId, game);
    const filename = encodeURIComponent(`game_scores_${game || 'all'}_${this.dateStr()}.csv`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
    return res.send(csv);
  }

  @Get('all/excel')
  @ApiOperation({ summary: '导出全部数据为 Excel', description: '导出所有记录（体重/睡眠/记账/游戏分数）到一个 xlsx 文件' })
  async exportAllExcel(@Request() req: any, @Res() res: Response) {
    const buffer = await this.exportService.exportAllExcel(req.user.userId);
    const filename = encodeURIComponent(`my_data_${this.dateStr()}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
    res.setHeader('Content-Length', buffer.length);
    return res.send(buffer);
  }

  private dateStr(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
