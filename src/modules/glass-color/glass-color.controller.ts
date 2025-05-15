import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { GlassColorService } from './glass-color.service';
import { CreateGlassColorDto } from 'src/DTO/glass-color/create-glass-color.dto';
import { UpdateGlassColorDto } from 'src/DTO/glass-color/update-glass-color';

@Controller('glass-colors')
export class GlassColorController {
  constructor(private readonly glassColorService: GlassColorService) {}

  @Get()
  getAll() {
    return this.glassColorService.findAll();
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.glassColorService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateGlassColorDto) {
    return this.glassColorService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGlassColorDto,
  ) {
    return this.glassColorService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.glassColorService.remove(id);
  }
}
