import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto, UpdateRatingDto } from 'src/DTO/rating/rating.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Rating } from 'src/entities/rating.entity';

@Controller('ratings')
export class RatingController {
  constructor(private readonly service: RatingService) {}

  @Post(':orderDetailId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  async create(
    @Param('orderDetailId', ParseIntPipe) id: number,
    @Body() dto: CreateRatingDto,
    @Request() req,
  ) {
    return this.service.createRating(id, dto, req.user.userId);
  }

  @Put(':ratingId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  async update(
    @Param('ratingId', ParseIntPipe) id: number,
    @Body() dto: UpdateRatingDto,
    @Request() req,
  ) {
    return this.service.updateRating(id, dto, req.user.userId);
  }

  @Get('check/:orderDetailId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  async check(
    @Param('orderDetailId', ParseIntPipe) id: number,
    @Request() req,
  ) {
    console.log('req.user:', req.user);
    const can = await this.service.canRate(id, req.user.userId);
    return { canRate: can };
  }
  @Get('glass-color/:id')
  async getByGlassColor(@Param('id', ParseIntPipe) id: number): Promise<any[]> {
    return this.service.getRatingsByGlassColor(id);
  }
}
