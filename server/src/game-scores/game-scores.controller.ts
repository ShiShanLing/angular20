import {
  Controller, Get, Post, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { GameScoresService } from './game-scores.service';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('game-scores')
@ApiBearerAuth()
@Controller('game-scores')
@UseGuards(AuthGuard)
export class GameScoresController {
  constructor(private readonly gameScoresService: GameScoresService) {}

  @Get()
  @ApiOperation({ summary: '查询游戏分数列表' })
  @ApiQuery({ name: 'game', required: false, description: '游戏: snake / tetris' })
  @ApiResponse({
    status: 200,
    schema: { example: [{ id: 1, userId: 1, game: 'snake', score: 150, createdAt: '2026-07-15T10:00:00.000Z' }] },
  })
  findAll(@Request() req: any, @Query('game') game?: string) {
    return this.gameScoresService.findAll(req.user.userId, game);
  }

  @Get('best')
  @ApiOperation({ summary: '查询最高分' })
  @ApiQuery({ name: 'game', required: false, description: '游戏: snake / tetris' })
  @ApiResponse({ status: 200, schema: { example: { score: 280 } } })
  getBest(@Request() req: any, @Query('game') game: string) {
    return this.gameScoresService.getBest(req.user.userId, game || 'snake');
  }

  @Post()
  @ApiOperation({ summary: '提交游戏分数' })
  @ApiResponse({
    status: 201,
    schema: { example: { id: 2, userId: 1, game: 'snake', score: 200, createdAt: '2026-07-16T10:00:00.000Z' } },
  })
  create(@Request() req: any, @Body() body: { game: string; score: number }) {
    return this.gameScoresService.create(req.user.userId, body.game, body.score);
  }
}
