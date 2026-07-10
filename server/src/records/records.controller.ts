import {
  Controller, Get, Post, Put, Delete, Body, Query, Param, UseGuards, Request,
} from '@nestjs/common';
import { RecordsService } from './records.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';

@Controller('records')
@UseGuards(AuthGuard)
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Get()
  findAll(
    @Request() req: any,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.recordsService.findAll(req.user.userId, type, startDate, endDate);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateRecordDto) {
    return this.recordsService.create(req.user.userId, dto.type, dto.data, dto.recordDate);
  }

  @Put(':id')
  async update(@Request() req: any, @Param('id') id: number, @Body() dto: UpdateRecordDto) {
    const result = await this.recordsService.update(id, req.user.userId, dto.data, dto.recordDate);
    if (!result) return { error: '记录不存在' };
    return result;
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: number) {
    const ok = await this.recordsService.remove(id, req.user.userId);
    return { success: ok };
  }

  @Post('sync')
  bulkSync(@Request() req: any, @Body() body: { type: string; records: any[] }) {
    return this.recordsService.bulkSync(req.user.userId, body.type, body.records);
  }
}
