import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CreatePracticeQuestionDto } from './dto/create-practice-question.dto';
import { ImportPracticeQuestionsDto } from './dto/import-practice-questions.dto';
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

  @Post(':track/questions')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '新增一道题' })
  create(@Param('track') track: string, @Body() dto: CreatePracticeQuestionDto) {
    return this.banks.createQuestion(track, dto);
  }

  @Post(':track/import')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '从 JSON 批量新增题目，已有 id 跳过' })
  importQuestions(@Param('track') track: string, @Body() dto: ImportPracticeQuestionsDto) {
    return this.banks.importQuestions(track, dto.questions);
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
