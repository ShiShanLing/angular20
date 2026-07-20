import { IsString, IsOptional, IsNotEmpty, IsNumber, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMarketReportDto {
  @ApiProperty({ description: '日期', example: '2026-07-17' })
  @IsString()
  @IsNotEmpty()
  date!: string;

  @ApiPropertyOptional({ description: 'AI情绪指数 0-100' })
  @IsOptional()
  @IsNumber()
  aiIndex?: number;

  @ApiPropertyOptional({ description: '关键词情绪指数' })
  @IsOptional()
  @IsNumber()
  kwIndex?: number;

  @ApiPropertyOptional({ description: '总帖子数' })
  @IsOptional()
  @IsNumber()
  totalPosts?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bullish?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bearish?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  fear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  greed?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  neutral?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bearFearPct?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  panicTotal?: number;

  @ApiPropertyOptional({ description: '板块数据 JSON' })
  @IsOptional()
  @IsObject()
  sectors?: any;

  @ApiPropertyOptional({ description: '完整 HTML 报告' })
  @IsOptional()
  @IsString()
  htmlContent?: string;
}
