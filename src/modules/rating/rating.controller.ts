import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDto, UpdateRatingDto } from 'src/DTO/rating/rating.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Rating } from 'src/entities/rating.entity';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('ratings')
export class RatingController {
  constructor(private readonly service: RatingService) {}

  @Get(':id')
  async getRatingById(@Param('id', ParseIntPipe) id: number) {
    return this.service.getRatingById(id);
  }

  @Post(':orderDetailId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  @UseInterceptors(FilesInterceptor('images')) // 'images' là tên field FormData
  async create(
    @Param('orderDetailId') id: number,
    @UploadedFiles() images: Express.Multer.File[],
    @Body() dto: CreateRatingDto,
    @Request() req,
  ) {
    return this.service.createRating(id, dto, req.user.userId, images);
  }

  @Put(':ratingId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('customer')
  @UseInterceptors(FilesInterceptor('images'))
  async update(
    @Param('ratingId', ParseIntPipe) id: number,
    @UploadedFiles() images: Express.Multer.File[],
    @Body() dto: UpdateRatingDto,
    @Request() req,
  ) {
    return this.service.updateRating(id, dto, req.user.userId, images);
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
  async getByGlassColor(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ average: number; count: number; ratings: any[] }> {
    return this.service.getRatingsByGlassColor(id);
  }
}
