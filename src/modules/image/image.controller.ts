import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { ImageService } from './image.service';
import { CreateImageDto } from 'src/DTO/image/create-image.dto';

@Controller('images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Get()
  async getImages(
    @Query('type') type: string,
    @Query('objectId') objectId: number,
  ) {
    return this.imageService.findImagesForObjects(type, [objectId]);
  }

  @Post()
  async createImage(@Body() dto: CreateImageDto) {
    return this.imageService.createImage(dto);
  }

  @Delete()
  async deleteByObject(
    @Query('type') type: string,
    @Query('objectId') objectId: number,
  ) {
    return this.imageService.deleteImagesByObject(type, objectId);
  }
}
