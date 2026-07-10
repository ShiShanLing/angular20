import {
  Controller, Get, Post, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { GameScoresService } from './game-scores.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('game-scores')
@UseGuards(AuthGuard)
export class GameScoresController {
  constructor(private readonly gameScoresService: GameScoresService) {}

  @Get()
  findAll(@Request() req: any, @Query('game') game?: string) {
    return this.gameScoresService.findAll(req.user.userId, game);
  }

  @Get('best')
  getBest(@Request() req: any, @Query('game') game: string) {
    return this.gameScoresService.getBest(req.user.userId, game || 'snake');
  }

  @Post()
  create(@Request() req: any, @Body() body: { game: string; score: number }) {
    return this.gameScoresService.create(req.user.userId, body.game, body.score);
  }
}
