import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateProductDto } from 'src/DTO/product/create-product.dto';
import { UpdateProductDto } from 'src/DTO/product/update-product.dto';
import { Glass } from 'src/entities/glass.entity';
import { GlassColor } from 'src/entities/glass_color.entity';
import { Order } from 'src/entities/order.entity';
import { OrderDetail } from 'src/entities/order_detail.entity';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { ImageService } from '../image/image.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Glass)
    private readonly glassRepo: Repository<Glass>,
    @InjectRepository(GlassColor)
    private readonly colorRepo: Repository<GlassColor>,
    @InjectRepository(OrderDetail)
    private readonly orderDetailRepo: Repository<OrderDetail>,
    private readonly imageService: ImageService,
  ) {}

  private async attachImagesToGlassColors(glasses: Glass[]): Promise<Glass[]> {
    const allColors = glasses.flatMap((g) => g.GlassColors);
    const colorIDs = allColors.map((c) => c.ID);

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

    for (const glass of glasses) {
      glass.GlassColors.forEach((color) => {
        (color as any).Images = imageMap.get(color.ID) || [];
      });
    }

    return glasses;
  }

  async findAll(): Promise<Glass[]> {
    const glasses = await this.glassRepo.find({ relations: ['GlassColors'] });
    return this.attachImagesToGlassColors(glasses);
  }

  async findOne(id: number): Promise<Glass> {
    const glass = await this.glassRepo.findOne({
      where: { ID: id },
      relations: ['GlassColors'],
    });
    if (!glass) throw new NotFoundException('Glass not found');

    const [result] = await this.attachImagesToGlassColors([glass]);
    return result;
  }

  async create(dto: CreateProductDto): Promise<Glass> {
    const { GlassColors, ...glassData } = dto;
    const glass = this.glassRepo.create(glassData);
    const savedGlass = await this.glassRepo.save(glass);

    const colors = GlassColors.map((c) =>
      this.colorRepo.create({ ...c, Glass: savedGlass }),
    );
    await this.colorRepo.save(colors);

    return this.findOne(savedGlass.ID); // return with relations
  }

  async update(
    id: number,
    dto: UpdateProductDto,
  ): Promise<{ data: Glass; warnings: string[] }> {
    const glass = await this.findOne(id);
    const { GlassColors, ...glassData } = dto;

    Object.assign(glass, glassData);
    await this.glassRepo.save(glass);

    const warnings: string[] = [];

    // if (Array.isArray(GlassColors)) {
    if (GlassColors) {
      const existingColors = await this.colorRepo.find({
        where: { Glass: { ID: id } },
      });

      const validIncomingIds = GlassColors.filter(
        (c) =>
          c.ID &&
          existingColors.some((e) => e.ID === c.ID && e.Color === c.Color),
      ).map((c) => c.ID);

      // 1. Tìm các màu cần xoá
      const colorsToDelete = existingColors.filter(
        (color) => !validIncomingIds.includes(color.ID),
      );

      // 2. Kiểm tra từng màu xem có đang được dùng không
      for (const color of colorsToDelete) {
        const isInUse = await this.orderDetailRepo.exist({
          where: { GlassColor: { ID: color.ID } },
        });

        if (isInUse) {
          warnings.push(
            `Không thể xoá màu "${color.Color}" (ID: ${color.ID}) vì đang được dùng trong đơn hàng.`,
          );
          continue; // bỏ qua không xoá
        }

        await this.colorRepo.remove(color);
      }

      for (const colorDto of GlassColors) {
        const matched = colorDto.ID
          ? existingColors.find(
              (c) => c.ID === colorDto.ID && c.Color === colorDto.Color,
            )
          : null;

        if (colorDto.ID && !matched) {
          warnings.push(
            `Màu với ID ${colorDto.ID} và tên "${colorDto.Color}" không hợp lệ, sẽ được thêm mới.`,
          );
        }

        if (matched) {
          Object.assign(matched, colorDto);
          await this.colorRepo.save(matched);
        } else {
          const newColor = this.colorRepo.create({ ...colorDto, Glass: glass });
          delete (newColor as any).ID;
          await this.colorRepo.save(newColor);
        }
      }
    }

    const updatedGlass = await this.findOne(id);
    return { data: updatedGlass, warnings };
  }
  async findByShapes(shapes: string[]): Promise<Glass[]> {
    if (!Array.isArray(shapes) || shapes.length === 0) {
      throw new Error('Shape array is required');
    }

    const glasses = await this.glassRepo.find({
      where: shapes.map((shape) => ({ Shape: shape })),
      relations: ['GlassColors'],
    });

    return this.attachImagesToGlassColors(glasses);
  }

  async findColorsByProductId(
    id: number,
  ): Promise<{ data: GlassColor[]; colors: string[] }> {
    const glass = await this.glassRepo.findOne({
      where: { ID: id },
      relations: ['GlassColors'],
    });

    if (!glass) {
      throw new NotFoundException(`Không tìm thấy sản phẩm với ID ${id}`);
    }

    const colorIDs = glass.GlassColors.map((c) => c.ID);

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

    const enrichedColors = glass.GlassColors.map((color) => ({
      ...color,
      Images: imageMap.get(color.ID) || [],
    }));

    const colorNames = enrichedColors.map((c) => c.Color);

    return {
      data: enrichedColors,
      colors: colorNames,
    };
  }
  async getProductsByCategory(category: string): Promise<Glass[]> {
    if (!category) {
      throw new Error('Category is required');
    }

    const glasses = await this.glassRepo.find({
      where: { Category: category },
      relations: ['GlassColors'],
    });

    return this.attachImagesToGlassColors(glasses);
  }

  async filterByIdsAndCategory(
    ids: number[],
    category: string,
  ): Promise<Glass[]> {
    const whereClause: FindOptionsWhere<Glass> = {
      ID: In(ids),
      Category: category,
    };

    const products: Glass[] = await this.glassRepo.find({
      where: whereClause,
      relations: ['GlassColors'],
    });

    return products;
  }
}
