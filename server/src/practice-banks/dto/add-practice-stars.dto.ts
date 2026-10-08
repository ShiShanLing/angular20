import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddPracticeStarsDto {
  @ApiProperty({ description: '要补进收藏表的题目 id', type: [String] })
  @IsArray()
  @IsString({ each: true })
  ids!: string[];
}
