import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeatherHistory } from './entities/weather-history.entity';
import { WeatherController } from './weather.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WeatherHistory])],
  controllers: [WeatherController],
})
export class WeatherModule {}
