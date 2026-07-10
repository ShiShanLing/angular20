import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRecordDto {
  @ApiProperty({ description: '记录类型', example: 'weight', enum: ['weight', 'sleep', 'accounting'] })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiPropertyOptional({ description: '记录数据 (JSON)', example: { weight: 70.5 } })
  @IsOptional()
  data!: any;

  @ApiPropertyOptional({ description: '记录日期', example: '2026-07-10' })
  @IsOptional()
  @IsString()
  recordDate?: string;
}
