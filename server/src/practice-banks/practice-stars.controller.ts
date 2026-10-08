import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AddPracticeStarsDto } from './dto/add-practice-stars.dto';
import { PracticeBanksService } from './practice-banks.service';

@ApiTags('practice-stars')
@Controller('practice-stars')
@UseGuards(AuthGuard)
export class PracticeStarsController {
  constructor(private readonly banks: PracticeBanksService) {}

  @Get(':track')
  @ApiOperation({ summary: '读取当前账号在某一科标过星的题目' })
  list(@Request() req: { user: { userId: number } }, @Param('track') track: string) {
    return this.banks.listStars(req.user.userId, track);
  }

  @Post(':track')
  @ApiOperation({ summary: '把本机多出来的标星补进收藏表' })
  addMany(
    @Request() req: { user: { userId: number } },
    @Param('track') track: string,
    @Body() dto: AddPracticeStarsDto,
  ) {
    return this.banks.addStars(req.user.userId, track, dto.ids);
  }

  @Put(':track/:questionId')
  @ApiOperation({ summary: '给一道题标星' })
  add(
    @Request() req: { user: { userId: number } },
    @Param('track') track: string,
    @Param('questionId') questionId: string,
  ) {
    return this.banks.addStar(req.user.userId, track, questionId);
  }

  @Delete(':track/:questionId')
  @ApiOperation({ summary: '取消一道题的标星' })
  remove(
    @Request() req: { user: { userId: number } },
    @Param('track') track: string,
    @Param('questionId') questionId: string,
  ) {
    return this.banks.removeStar(req.user.userId, track, questionId);
  }
}
