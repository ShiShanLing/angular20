import { IsNumber, IsString, Max, Min, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePracticeQuestionDto {
  @ApiProperty({ description: '题干' })
  @IsString()
  @MinLength(1)
  question!: string;

  @ApiProperty({ description: '答案' })
  @IsString()
  @MinLength(1)
  answer!: string;

  @ApiProperty({ description: '真实排序值，可以是小数。页面序号会按这个值重排。' })
  @IsNumber()
  @Min(-1000000)
  @Max(1000000)
  sort!: number;
}
