import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { UpdatePracticeQuestionDto } from './dto/update-practice-question.dto';
import { PracticeBanksService } from './practice-banks.service';

@ApiTags('practice-banks')
@Controller('practice-banks')
export class PracticeBanksController {
  constructor(private readonly banks: PracticeBanksService) {}

  @Get(':track')
  @ApiOperation({ summary: '读取某一科的题目，一题一行' })
  list(@Param('track') track: string) {
    return this.banks.listQuestions(track);
  }

  @Patch(':track/questions/:questionId')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '修改一道题的题目和答案' })
  update(
    @Param('track') track: string,
    @Param('questionId') questionId: string,
    @Body() dto: UpdatePracticeQuestionDto,
  ) {
    return this.banks.updateQuestion(track, questionId, dto);
  }
}
