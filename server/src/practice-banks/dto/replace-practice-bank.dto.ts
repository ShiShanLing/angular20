import { IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReplacePracticeBankDto {
  @ApiProperty({ description: '这一科的完整题目数组', type: 'array' })
  @IsArray()
  questions!: unknown[];
}
