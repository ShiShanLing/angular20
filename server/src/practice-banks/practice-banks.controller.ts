import { Body, Controller, Get, Param, Patch, Put, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { ReplacePracticeBankDto } from './dto/replace-practice-bank.dto';
import { UpdatePracticeQuestionDto } from './dto/update-practice-question.dto';
import { PracticeBanksService } from './practice-banks.service';

@ApiTags('practice-banks')
@Controller('practice-banks')
export class PracticeBanksController {
  constructor(private readonly banks: PracticeBanksService) {}

  @Get(':track')
  @ApiOperation({ summary: '读取某一科的线上题库' })
  get(@Param('track') track: string) {
    return this.banks.get(track);
  }

  @Put(':track')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '用完整题目数组创建或替换某一科的线上题库' })
  replace(@Param('track') track: string, @Body() dto: ReplacePracticeBankDto) {
    return this.banks.replace(track, dto.questions);
  }

  @Patch(':track/questions/:questionId')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '修改线上题库中的一道题' })
  update(
    @Param('track') track: string,
    @Param('questionId') questionId: string,
    @Body() dto: UpdatePracticeQuestionDto,
  ) {
    return this.banks.updateQuestion(track, questionId, dto);
  }
}
