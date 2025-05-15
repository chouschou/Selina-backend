import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GlassColor } from 'src/entities/glass_color.entity';
import { Glass } from 'src/entities/glass.entity';
import { CreateGlassColorDto } from 'src/DTO/glass-color/create-glass-color.dto';
import { UpdateGlassColorDto } from 'src/DTO/glass-color/update-glass-color';

@Injectable()
export class GlassColorService {
  constructor(
    @InjectRepository(GlassColor)
    private readonly colorRepo: Repository<GlassColor>,
    @InjectRepository(Glass)
    private readonly glassRepo: Repository<Glass>,
  ) {}

  async findAll(): Promise<GlassColor[]> {
    return this.colorRepo.find({ relations: ['Glass'] });
  }

  async findOne(id: number): Promise<GlassColor> {
    const color = await this.colorRepo.findOne({
      where: { ID: id },
      relations: ['Glass'],
    });
    if (!color) throw new NotFoundException('GlassColor not found');
    return color;
  }

  async create(dto: CreateGlassColorDto): Promise<GlassColor> {
    const glass = await this.glassRepo.findOne({ where: { ID: dto.Glass_ID } });
    if (!glass) throw new NotFoundException('Glass not found');

    const color = this.colorRepo.create({ ...dto, Glass: glass });
    return this.colorRepo.save(color);
  }

  async update(id: number, dto: UpdateGlassColorDto): Promise<GlassColor> {
    const color = await this.findOne(id);
    if (dto.Glass_ID) {
      const glass = await this.glassRepo.findOne({
        where: { ID: dto.Glass_ID },
      });
      if (!glass) throw new NotFoundException('Glass not found');
      color.Glass = glass;
    }
    Object.assign(color, dto);
    return this.colorRepo.save(color);
  }

  async remove(id: number): Promise<void> {
    const color = await this.findOne(id);
    await this.colorRepo.remove(color);
  }
}
