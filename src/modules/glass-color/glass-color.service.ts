import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GlassColor } from 'src/entities/glass_color.entity';
import { Glass } from 'src/entities/glass.entity';
import { CreateGlassColorDto } from 'src/DTO/glass-color/create-glass-color.dto';
import { UpdateGlassColorDto } from 'src/DTO/glass-color/update-glass-color';
import { ImageService } from '../image/image.service';

@Injectable()
export class GlassColorService {
  constructor(
    @InjectRepository(GlassColor)
    private readonly colorRepo: Repository<GlassColor>,
    @InjectRepository(Glass)
    private readonly glassRepo: Repository<Glass>,
    private readonly imageService: ImageService,
  ) {}
  async attachImagesToGlassColors(
    glassColors: GlassColor[],
  ): Promise<GlassColor[]> {
    const colorIDs = glassColors.map((c) => c.ID);

    const images = await this.imageService.findImagesForObjects(
      'glass_color',
      colorIDs,
    );

    const imageMap = new Map<number, string[]>();

    for (const img of images) {
      if (!imageMap.has(img.object_ID)) {
        imageMap.set(img.object_ID, []);
      }
      imageMap.get(img.object_ID)!.push(img.ImagePath);
    }

    for (const glassColor of glassColors) {
      // Thêm field Images nếu chưa có
      (glassColor as any).Images = imageMap.get(glassColor.ID) || [];
    }

    return glassColors;
  }

  async findAll(): Promise<GlassColor[]> {
    return this.colorRepo.find({ relations: ['Glass'] });
  }

  async findOne(id: number): Promise<GlassColor> {
    const color = await this.colorRepo.findOne({
      where: { ID: id },
      relations: ['Glass'],
    });
    if (!color) throw new NotFoundException('GlassColor not found');

    const [result] = await this.attachImagesToGlassColors([color]);
    return result;
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
