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
import { GlassService } from './glass.service';
import { CreateGlassDto } from 'src/DTO/glass/create-glass.dto';
import { UpdateGlassDto } from 'src/DTO/glass/update-glass.dto';

@Controller('glasses')
export class GlassController {
  constructor(private readonly glassService: GlassService) {}

  @Get()
  getAll() {
    return this.glassService.findAll();
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.glassService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateGlassDto) {
    return this.glassService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGlassDto) {
    return this.glassService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.glassService.remove(id);
  }
}
