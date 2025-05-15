import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Glass } from 'src/entities/glass.entity';
import { CreateGlassDto } from 'src/DTO/glass/create-glass.dto';
import { UpdateGlassDto } from 'src/DTO/glass/update-glass.dto';

@Injectable()
export class GlassService {
  constructor(
    @InjectRepository(Glass)
    private readonly glassRepo: Repository<Glass>,
  ) {}

  async findAll(): Promise<Glass[]> {
    return this.glassRepo.find({ relations: ['GlassColors'] });
  }

  async findOne(id: number): Promise<Glass> {
    const glass = await this.glassRepo.findOne({
      where: { ID: id },
      relations: ['GlassColors'],
    });
    if (!glass) throw new NotFoundException('Glass not found');
    return glass;
  }

  async create(dto: CreateGlassDto): Promise<Glass> {
    const glass = this.glassRepo.create(dto);
    return this.glassRepo.save(glass);
  }

  async update(id: number, dto: UpdateGlassDto): Promise<Glass> {
    const glass = await this.findOne(id);
    const updated = Object.assign(glass, dto);
    return this.glassRepo.save(updated);
  }

  async remove(id: number): Promise<{ message: string }> {
    const glass = await this.findOne(id);
    await this.glassRepo.remove(glass);
    return { message: 'Xóa thành công' };
  }
}
