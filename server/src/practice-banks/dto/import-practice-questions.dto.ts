import { IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ImportPracticeQuestionsDto {
  @ApiProperty({ description: '要新增的题目。已有 id 会跳过，避免覆盖线上修改。', type: 'array' })
  @IsArray()
  questions!: unknown[];
}
