import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePracticeQuestionDto {
  @ApiProperty({ description: '新的答案' })
  @IsString()
  @IsNotEmpty()
  answer!: string;

  @ApiPropertyOptional({ description: '新的题目，不传则保持原题干' })
  @IsOptional()
  @IsString()
  question?: string;
}
