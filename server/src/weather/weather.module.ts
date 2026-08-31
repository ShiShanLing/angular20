import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeatherHistory } from './entities/weather-history.entity';
import { WeatherController } from './weather.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([WeatherHistory]), AuthModule],
  controllers: [WeatherController],
})
export class WeatherModule {}
