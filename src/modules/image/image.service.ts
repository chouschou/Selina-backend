import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Image } from 'src/entities/image.entity';
import { CreateImageDto } from 'src/DTO/image/create-image.dto';

@Injectable()
export class ImageService {
  constructor(
    @InjectRepository(Image)
    private readonly imageRepo: Repository<Image>,
  ) {}

  // Tạo ảnh mới
  async createImage(dto: CreateImageDto): Promise<Image> {
    const image = this.imageRepo.create(dto);
    return this.imageRepo.save(image);
  }

  // Lấy ảnh theo object_type + object_ID
  async findImagesForObjects(
    objectType: string,
    objectIDs: number[],
  ): Promise<Image[]> {
    return this.imageRepo.find({
      where: {
        object_type: objectType,
        object_ID: In(objectIDs),
      },
    });
  }

  // Xoá ảnh theo object_type + object_ID
  async deleteImagesByObject(
    objectType: string,
    objectID: number,
  ): Promise<void> {
    const images = await this.imageRepo.find({
      where: { object_type: objectType, object_ID: objectID },
    });

    if (!images.length) {
      throw new NotFoundException('No images found for the given object');
    }

    await this.imageRepo.remove(images);
  }
}
