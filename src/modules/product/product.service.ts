import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateProductDto } from 'src/DTO/product/create-product.dto';
import { UpdateProductDto } from 'src/DTO/product/update-product.dto';
import { Glass } from 'src/entities/glass.entity';
import { GlassColor } from 'src/entities/glass_color.entity';
import { OrderDetail } from 'src/entities/order_detail.entity';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { ImageService } from '../image/image.service';
import { GlassColorDto } from 'src/DTO/product/glass-color.dto';
import { S3Service } from 'src/shared/s3.service';
import { processModelImage } from './processImageBeforeUpload';

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
    private readonly s3Service: S3Service,
  ) {}

  async createWithFiles(
    body: any,
    files: Express.Multer.File[],
  ): Promise<Glass> {
    const { GlassColors, ...glassData } = this.parseGlassData(body);

    const glass = this.glassRepo.create(glassData);
    const savedGlass = await this.glassRepo.save(glass);

    for (let i = 0; i < GlassColors.length; i++) {
      const colorDto = GlassColors[i];

      const prefix = `glassColors[${i}]`;

      const modelFile = files.find(
        (f) => f.fieldname === `${prefix}.ModelVirtualTryOn`,
      );
      const image3DFile = files.find(
        (f) => f.fieldname === `${prefix}.Image3DPath`,
      );
      const imageFiles = files.filter(
        (f) => f.fieldname === `${prefix}.Images`,
      );

      // const ModelVirtualTryOnUrl = modelFile
      //   ? await this.uploadImageVirtualToS3(modelFile)
      //   : null;

      let ModelVirtualTryOnUrl: string | null = null;

      if (modelFile) {
        const processedBuffer = await processModelImage(modelFile.buffer);

        const processedFile: Express.Multer.File = {
          ...modelFile,
          buffer: processedBuffer,
        };

        ModelVirtualTryOnUrl = await this.uploadImageVirtualToS3(processedFile);
      }

      const Image3DPathUrl = image3DFile
        ? await this.uploadModelToS3(image3DFile)
        : null;
      const imageUrls = await Promise.all(
        imageFiles.map((f) => this.uploadImageToS3(f)),
      );

      const newColor = new GlassColor();
      Object.assign(newColor, colorDto);
      newColor.Glass_ID = savedGlass.ID;
      newColor.ModelVirtualTryOn = ModelVirtualTryOnUrl;
      newColor.Image3DPath = Image3DPathUrl;
      const savedColor = await this.colorRepo.save(newColor);

      for (const imgUrl of imageUrls) {
        await this.imageService.createImage({
          object_ID: savedColor.ID,
          object_type: 'glass_color',
          ImagePath: imgUrl,
        });
      }
    }

    return this.findOne(savedGlass.ID);
  }

  private parseGlassData(formData: Record<string, any>): {
    GlassColors: GlassColorDto[];
    [key: string]: any;
  } {
    const glassColorsMap: Record<number, Partial<GlassColorDto>> = {};

    for (const key in formData) {
      const match = key.match(/^glassColors\[(\d+)]\.(.+)$/);
      if (match) {
        const index = Number(match[1]);
        const field = match[2];

        if (!glassColorsMap[index]) {
          glassColorsMap[index] = {};
        }

        glassColorsMap[index][field as keyof GlassColorDto] = formData[key];
      }
    }

    const colorsArray: GlassColorDto[] = Object.values(glassColorsMap).map(
      (color) => ({
        Color: String(color.Color ?? ''),
        Quantity: Number(color.Quantity ?? 0),
        Price: Number(color.Price ?? 0),
        Discount: Number(color.Discount ?? 0),
        ModelVirtualTryOn: String(color.ModelVirtualTryOn ?? ''),
        Image3DPath: color.Image3DPath ? String(color.Image3DPath) : undefined,
        Images: Array.isArray(color.Images) ? color.Images : [],
        Status: String(color.Status ?? ''),
      }),
    );

    // Tạo object mới, tránh trả thẳng formData nguyên gốc (có thể có any)
    const { ...rest } = formData;
    delete rest.GlassColors; // tránh bị trùng

    return {
      ...rest,
      GlassColors: colorsArray,
    };
  }
  private parseGlassUpdateData(formData: Record<string, any>): {
    GlassColors: GlassColorDto[];
    [key: string]: any;
  } {
    const glassColorsMap: Record<number, Partial<GlassColorDto>> = {};

    for (const key in formData) {
      const match = key.match(/^glassColors\[(\d+)]\.(.+)$/);
      if (match) {
        const index = Number(match[1]);
        const field = match[2];

        if (!glassColorsMap[index]) {
          glassColorsMap[index] = {};
        }

        glassColorsMap[index][field as keyof GlassColorDto] = formData[key];
      }
    }

    const colorsArray: GlassColorDto[] = Object.values(glassColorsMap).map(
      (color) => ({
        ID: color.ID !== undefined ? Number(color.ID) : undefined,
        Color: String(color.Color ?? ''),
        Quantity: Number(color.Quantity ?? 0),
        Price: Number(color.Price ?? 0),
        Discount: Number(color.Discount ?? 0),
        ModelVirtualTryOn: String(color.ModelVirtualTryOn ?? ''),
        // Image3DPath: color.Image3DPath ? String(color.Image3DPath) : undefined,
        Image3DPath:
          color.Image3DPath === undefined
            ? undefined
            : String(color.Image3DPath),

        // Images: Array.isArray(color.Images) ? color.Images : [],
        Images:
          typeof color.Images === 'string'
            ? [color.Images]
            : Array.isArray(color.Images)
              ? color.Images
              : [],
        Status: String(color.Status ?? ''),
      }),
    );

    // Tạo object mới, tránh trả thẳng formData nguyên gốc (có thể có any)
    const { ...rest } = formData;
    delete rest.GlassColors; // tránh bị trùng

    return {
      ...rest,
      GlassColors: colorsArray,
    };
  }

  private async uploadImageToS3(file: Express.Multer.File): Promise<string> {
    return this.s3Service.uploadFile(file.buffer, file.originalname, 'images');
  }

  private async uploadImageVirtualToS3(
    file: Express.Multer.File,
  ): Promise<string> {
    return this.s3Service.uploadFile(
      file.buffer,
      file.originalname,
      'imageVirtual',
    );
  }

  private async uploadModelToS3(file: Express.Multer.File): Promise<string> {
    return this.s3Service.uploadFile(file.buffer, file.originalname, 'model3D');
  }

  async updateWithFiles(
    id: number,
    formData: any,
    files: Express.Multer.File[],
  ): Promise<{ data: Glass; warnings: string[] }> {
    console.log('formData:---', formData);
    const glass = await this.findOne(id);
    const { GlassColors, ...glassData } = this.parseGlassUpdateData(formData);
    Object.assign(glass, glassData);
    await this.glassRepo.save(glass);

    const warnings: string[] = [];

    const existingColors = await this.colorRepo.find({
      where: { Glass: { ID: id } },
    });

    const validIncomingIds = GlassColors.filter(
      (c) => c.ID && existingColors.some((e) => e.ID === Number(c.ID)),
    ).map((c) => Number(c.ID));

    const colorsToDelete = existingColors.filter(
      (color) => !validIncomingIds.includes(color.ID),
    );

    for (const color of colorsToDelete) {
      const isInUse = await this.orderDetailRepo.exist({
        where: { GlassColor: { ID: color.ID } },
      });
      if (isInUse) {
        warnings.push(
          `Không thể xoá màu "${color.Color}" vì đang dùng trong đơn hàng.`,
        );
        continue;
      }
      await this.colorRepo.remove(color);
    }

    for (let i = 0; i < GlassColors.length; i++) {
      const colorDto = GlassColors[i];
      const prefix = `glassColors[${i}]`;

      const modelFile = files.find(
        (f) => f.fieldname === `${prefix}.ModelVirtualTryOn`,
      );
      const image3DFile = files.find(
        (f) => f.fieldname === `${prefix}.Image3DPath`,
      );
      const imageFiles = files.filter(
        (f) => f.fieldname === `${prefix}.Images`,
      );

      const colorId = colorDto.ID ? Number(colorDto.ID) : null;
      let matchedColor: GlassColor | null = colorId
        ? (existingColors.find((c) => c.ID === colorId) ?? null)
        : null;

      if (colorId && !matchedColor) {
        warnings.push(`Màu với ID ${colorId} không hợp lệ, sẽ thêm mới.`);
      }

      if (!matchedColor) {
        matchedColor = this.colorRepo.create({ ...colorDto, Glass: glass });
        delete (matchedColor as any).ID;
      } else {
        Object.assign(matchedColor, colorDto);
      }

      // Handle ModelVirtualTryOn
      if (modelFile) {
        const oldUrl = matchedColor.ModelVirtualTryOn || '';
        // const newUrl = await this.uploadImageVirtualToS3(modelFile);
        const processedBuffer = await processModelImage(modelFile.buffer);

        const processedModelFile: Express.Multer.File = {
          ...modelFile,
          buffer: processedBuffer,
        };

        const newUrl = await this.uploadImageVirtualToS3(processedModelFile);

        if (oldUrl && oldUrl !== newUrl) {
          await this.s3Service.deleteFileFromS3(oldUrl);
        }
        matchedColor.ModelVirtualTryOn = newUrl;
      } else if (
        colorDto.ModelVirtualTryOn !== undefined &&
        colorDto.ModelVirtualTryOn.trim() === '' &&
        matchedColor.ModelVirtualTryOn
      ) {
        await this.s3Service.deleteFileFromS3(matchedColor.ModelVirtualTryOn);
        matchedColor.ModelVirtualTryOn = null;
      }

      // Handle Image3DPath (nullable)
      if (image3DFile) {
        const newUrl = await this.uploadModelToS3(image3DFile);
        if (matchedColor.Image3DPath && matchedColor.Image3DPath !== newUrl) {
          await this.s3Service.deleteFileFromS3(matchedColor.Image3DPath);
        }
        matchedColor.Image3DPath = newUrl;
      } else {
        const incomingImage3D = colorDto.Image3DPath;

        // Nếu gửi chuỗi rỗng hoặc không gửi gì thì coi như muốn xoá
        const shouldDelete =
          incomingImage3D === undefined || incomingImage3D.trim() === '';

        if (shouldDelete && matchedColor.Image3DPath) {
          await this.s3Service.deleteFileFromS3(matchedColor.Image3DPath);
          matchedColor.Image3DPath = null;
        }
      }

      const savedColor = await this.colorRepo.save(matchedColor);

      // Handle Images array: giữ cũ + thêm mới
      const keepUrls =
        colorDto.Images?.filter((url: string) => !!url.trim()) || [];
      const newUploaded = await Promise.all(
        imageFiles.map((file) => this.uploadImageToS3(file)),
      );
      const finalImagePaths = [...keepUrls, ...newUploaded];

      const oldImages = await this.imageService.findImagesForObjects(
        'glass_color',
        [savedColor.ID],
      );
      const oldPaths = oldImages.map((img) => img.ImagePath);

      const toDelete = oldPaths.filter((old) => !finalImagePaths.includes(old));
      for (const path of toDelete) {
        await this.s3Service.deleteFileFromS3(path);
      }
      await this.imageService.deleteImagesByObject(
        'glass_color',
        savedColor.ID,
      );

      for (const path of finalImagePaths) {
        await this.imageService.createImage({
          object_ID: savedColor.ID,
          object_type: 'glass_color',
          ImagePath: path,
        });
      }
    }

    const updatedGlass = await this.findOne(id);
    return { data: updatedGlass, warnings };
  }

  async attachImagesToGlassColors(glasses: Glass[]): Promise<Glass[]> {
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

    for (const c of GlassColors) {
      const { Images, ...colorData } = c;

      const color = this.colorRepo.create({ ...colorData, Glass: savedGlass });
      const savedColor = await this.colorRepo.save(color);

      if (Images && Images.length > 0) {
        const imageEntities = Images.map((imgPath) =>
          this.imageService.createImage({
            object_ID: savedColor.ID,
            object_type: 'glass_color',
            ImagePath: imgPath,
          }),
        );
        await Promise.all(imageEntities);
      }
    }

    return this.findOne(savedGlass.ID);
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

        let savedColor: GlassColor;

        //---xử lý ảnh----
        if (matched) {
          Object.assign(matched, colorDto);
          savedColor = await this.colorRepo.save(matched);
        } else {
          const newColor = this.colorRepo.create({ ...colorDto, Glass: glass });
          delete (newColor as any).ID;
          savedColor = await this.colorRepo.save(newColor);
        }

        // Lấy ảnh cũ từ DB
        const oldImages = await this.imageService.findImagesForObjects(
          'glass_color',
          [savedColor.ID],
        );

        // Chuyển ảnh về dạng string[] để dễ so sánh
        const oldImagePaths = oldImages.map((img) => img.ImagePath).sort();
        const newImagePaths = (colorDto.Images || []).slice().sort();

        // So sánh 2 mảng ảnh
        const isSame =
          oldImagePaths.length === newImagePaths.length &&
          oldImagePaths.every((path, index) => path === newImagePaths[index]);

        if (!isSame) {
          // Nếu ảnh thay đổi: xoá ảnh cũ + thêm mới
          await this.imageService.deleteImagesByObject(
            'glass_color',
            savedColor.ID,
          );

          const newImages = newImagePaths.map((path) =>
            this.imageService.createImage({
              object_ID: savedColor.ID,
              object_type: 'glass_color',
              ImagePath: path,
            }),
          );
          await Promise.all(newImages);
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

  async findUsedGlassColors(glassId: number): Promise<string[]> {
    const glassColors = await this.colorRepo.find({
      where: { Glass: { ID: glassId } },
    });

    const usedColors: string[] = [];

    for (const color of glassColors) {
      const isUsed = await this.orderDetailRepo.exist({
        where: { GlassColor: { ID: color.ID } },
      });

      if (isUsed) {
        usedColors.push(color.Color);
      }
    }

    return usedColors;
  }

  async countOrdersWithGlassColor(glassColorId: number): Promise<number> {
    return this.orderDetailRepo
      .createQueryBuilder('orderDetail')
      .where('orderDetail.Glass_Color_ID = :id', { id: glassColorId })
      .getCount();
  }

  async deleteGlassColor(glassColorId: number): Promise<void> {
    // Kiểm tra GlassColor tồn tại
    const glassColor = await this.colorRepo.findOne({
      where: { ID: glassColorId },
      relations: ['Glass'],
    });
    if (!glassColor) {
      throw new NotFoundException(
        `GlassColor with ID ${glassColorId} not found`,
      );
    }

    // Kiểm tra có trong đơn hàng chưa
    const count = await this.countOrdersWithGlassColor(glassColorId);
    if (count > 0) {
      throw new BadRequestException(
        `Cannot delete GlassColor ID ${glassColorId} because it is in ${count} order(s)`,
      );
    }

    // Lấy Glass và các GlassColor liên quan
    const glass = await this.glassRepo.findOne({
      where: { ID: glassColor.Glass_ID },
      relations: ['GlassColors'],
    });
    if (!glass) {
      throw new NotFoundException(
        `Glass with ID ${glassColor.Glass_ID} not found`,
      );
    }

    if (glass.GlassColors.length <= 1) {
      // Xoá cả GlassColor và Glass
      await this.colorRepo.delete(glassColorId);
      await this.glassRepo.delete(glass.ID);
    } else {
      // Chỉ xoá GlassColor
      await this.colorRepo.delete(glassColorId);
    }
  }
}
