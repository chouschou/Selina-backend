import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('shape')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  getStatisticsByShape(
    @Query('statisticsBy') statisticsBy: string,
    @Query('time') time: string,
  ) {
    return this.statisticsService.getStatisticsByShape(statisticsBy, time);
  }

  @Get('material')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  getStatisticsByMaterial(
    @Query('statisticsBy') statisticsBy: string,
    @Query('time') time: string,
  ) {
    return this.statisticsService.getStatisticsByMaterial(statisticsBy, time);
  }

  @Get('age')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  getStatisticsByAge(
    @Query('statisticsBy') statisticsBy: string,
    @Query('time') time: string,
  ) {
    return this.statisticsService.getStatisticsByAge(statisticsBy, time);
  }

  @Get('price')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  getStatisticsByPrice(
    @Query('statisticsBy') statisticsBy: string,
    @Query('time') time: string,
  ) {
    return this.statisticsService.getStatisticsByPrice(statisticsBy, time);
  }

  @Get('type')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  getStatisticsByType(
    @Query('statisticsBy') statisticsBy: string,
    @Query('time') time: string,
  ) {
    return this.statisticsService.getStatisticsByType(statisticsBy, time);
  }

  @Get('revenue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  getRevenueStatistics(
    @Query('statisticsBy') statisticsBy: 'year' | 'all',
    @Query('time') time: string,
  ) {
    return this.statisticsService.getRevenueStatistics(statisticsBy, time);
  }
}
