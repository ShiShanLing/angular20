import {
  Controller, Get, Post, Put, Delete, Body, Query, Param, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { RecordsService } from './records.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';

@ApiTags('records')
@ApiBearerAuth()
@Controller('records')
@UseGuards(AuthGuard)
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Get()
  @ApiOperation({ summary: '查询记录列表' })
  @ApiQuery({ name: 'type', required: false, description: '类型: weight / sleep / accounting' })
  @ApiQuery({ name: 'startDate', required: false, description: '开始日期 YYYY-MM-DD' })
  @ApiQuery({ name: 'endDate', required: false, description: '结束日期 YYYY-MM-DD' })
  @ApiResponse({
    status: 200,
    description: '返回记录列表',
    schema: {
      example: [
        { id: 1, userId: 1, type: 'weight', data: { value: 65.5 }, recordDate: '2026-07-15', createdAt: '2026-07-15T10:00:00.000Z', updatedAt: '2026-07-15T10:00:00.000Z' },
      ],
    },
  })
  findAll(
    @Request() req: any,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.recordsService.findAll(req.user.userId, type, startDate, endDate);
  }

  @Post()
  @ApiOperation({ summary: '创建记录' })
  @ApiResponse({
    status: 201,
    description: '返回创建的记录',
    schema: { example: { id: 1, userId: 1, type: 'weight', data: { value: 65.5 }, recordDate: '2026-07-15', createdAt: '2026-07-15T10:00:00.000Z', updatedAt: '2026-07-15T10:00:00.000Z' } },
  })
  create(@Request() req: any, @Body() dto: CreateRecordDto) {
    return this.recordsService.create(req.user.userId, dto.type, dto.data, dto.recordDate);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新记录' })
  async update(@Request() req: any, @Param('id') id: number, @Body() dto: UpdateRecordDto) {
    const result = await this.recordsService.update(id, req.user.userId, dto.data, dto.recordDate);
    if (!result) return { error: '记录不存在' };
    return result;
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除记录' })
  @ApiResponse({ status: 200, schema: { example: { success: true } } })
  async remove(@Request() req: any, @Param('id') id: number) {
    const ok = await this.recordsService.remove(id, req.user.userId);
    return { success: ok };
  }

  @Post('sync')
  @ApiOperation({ summary: '批量同步记录', description: '先删除该类型所有旧记录，再批量插入' })
  @ApiResponse({ status: 201, schema: { example: { inserted: 5 } } })
  bulkSync(@Request() req: any, @Body() body: { type: string; records: any[] }) {
    return this.recordsService.bulkSync(req.user.userId, body.type, body.records);
  }
}
