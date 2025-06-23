import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRatingDto, UpdateRatingDto } from 'src/DTO/rating/rating.dto';
import { Account } from 'src/entities/account.entity';
import { AccountDelivery } from 'src/entities/account_delivery.entity';
import { Customer } from 'src/entities/customer.entity';
import { Image } from 'src/entities/image.entity';
import { Order } from 'src/entities/order.entity';
import { OrderDetail } from 'src/entities/order_detail.entity';
import { OrderStatus } from 'src/entities/order_status.entity';
import { Rating } from 'src/entities/rating.entity';
import { S3Service } from 'src/shared/s3.service';
import { Repository } from 'typeorm';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating) private ratingRepo: Repository<Rating>,
    @InjectRepository(OrderDetail)
    private orderDetailRepo: Repository<OrderDetail>,
    @InjectRepository(OrderStatus)
    private orderStatusRepo: Repository<OrderStatus>,
    private readonly s3Service: S3Service,
    @InjectRepository(Image)
    private readonly imageRepo: Repository<Image>,
  ) {}

  async getRatingById(id: number) {
    const rating = await this.ratingRepo.findOne({
      where: { ID: id },
    });

    if (!rating) throw new NotFoundException('Không tìm thấy đánh giá');

    const images = await this.imageRepo.find({
      where: { object_ID: id, object_type: 'rating' },
    });

    return {
      ...rating,
      Images: images,
    };
  }

  async canRate(orderDetailId: number, userId: number): Promise<boolean> {
    const orderDetail = await this.orderDetailRepo.findOne({
      where: { ID: orderDetailId },
      relations: [
        'Order',
        'Order.AccountDelivery',
        'Order.AccountDelivery.Account',
      ],
    });
    if (!orderDetail) throw new NotFoundException('Không tìm thấy OrderDetail');

    if (orderDetail.Order.AccountDelivery.Account.ID !== userId)
      throw new ForbiddenException('Bạn không có quyền đánh giá đơn hàng này');

    const completed = await this.orderStatusRepo
      .createQueryBuilder('status')
      .where('status.Order_ID = :orderId', { orderId: orderDetail.Order.ID })
      .andWhere('status.Status = :status', { status: 'completed' })
      .orderBy('status.CreateAt', 'DESC')
      .getOne();

    if (!completed) return false;

    const deadline = new Date(completed.CreateAt);
    deadline.setDate(deadline.getDate() + 7);
    return new Date() <= deadline;
  }

  async createRating(
    orderDetailId: number,
    dto: CreateRatingDto,
    userId: number,
    imageFiles: Express.Multer.File[],
  ) {
    const can = await this.canRate(orderDetailId, userId);
    if (!can) throw new BadRequestException('Không thể đánh giá');

    const orderDetail = await this.orderDetailRepo.findOne({
      where: { ID: orderDetailId },
      relations: ['Rating'],
    });
    if (!orderDetail) throw new NotFoundException('Không tìm thấy OrderDetail');
    if (orderDetail.Rating) throw new BadRequestException('Đã có đánh giá');

    // Tạo đánh giá mới
    const rating = this.ratingRepo.create({
      Value: dto.Value,
      Comment: dto.Comment,
      CreateAt: new Date(),
    });
    const savedRating = await this.ratingRepo.save(rating);

    orderDetail.Rating = savedRating;
    await this.orderDetailRepo.save(orderDetail);

    // Xử lý ảnh nếu có
    if (imageFiles?.length) {
      const imageUrls = await Promise.all(
        imageFiles.map((f) =>
          this.s3Service.uploadFile(f.buffer, f.originalname, 'ratings'),
        ),
      );

      const imageEntities = imageUrls.map((url) =>
        this.imageRepo.create({
          object_ID: savedRating.ID,
          object_type: 'rating',
          ImagePath: url,
        }),
      );

      await this.imageRepo.save(imageEntities);
    }

    return savedRating;
  }

  async updateRating(
    ratingId: number,
    dto: UpdateRatingDto,
    userId: number,
    imageFiles: Express.Multer.File[],
  ): Promise<Rating> {
    const orderDetail = await this.orderDetailRepo.findOne({
      where: { Rating: { ID: ratingId } },
      relations: [
        'Order',
        'Order.AccountDelivery',
        'Order.AccountDelivery.Account',
      ],
    });

    if (
      !orderDetail ||
      orderDetail.Order.AccountDelivery.Account.ID !== userId
    ) {
      throw new ForbiddenException('Không có quyền');
    }

    const can = await this.canRate(orderDetail.ID, userId);
    if (!can) throw new BadRequestException('Hết hạn chỉnh sửa');

    const rating = await this.ratingRepo.findOne({ where: { ID: ratingId } });
    if (!rating) throw new NotFoundException('Không tìm thấy đánh giá');

    if (dto.Value !== undefined) rating.Value = dto.Value;
    if (dto.Comment !== undefined) rating.Comment = dto.Comment;

    const updated = await this.ratingRepo.save(rating);

    // --- Xử lý ảnh ---
    const currentImages = await this.imageRepo.find({
      where: { object_ID: ratingId, object_type: 'rating' },
    });

    const frontendImagePaths = dto.ImagePaths || [];

    // Tìm các ảnh cần xoá (có trong DB nhưng không còn trong frontend gửi lên)
    const imagesToDelete = currentImages.filter(
      (img) => !frontendImagePaths.includes(img.ImagePath),
    );

    for (const img of imagesToDelete) {
      await this.s3Service.deleteFileFromS3(img.ImagePath);
    }

    await this.imageRepo.remove(imagesToDelete);

    // Tạo các ảnh mới (chỉ thêm nếu ảnh chưa có)
    const newImageEntities: Image[] = [];

    if (imageFiles && imageFiles.length > 0) {
      const uploadPromises = imageFiles.map((f) =>
        this.s3Service.uploadFile(f.buffer, f.originalname, 'ratings'),
      );

      const uploadedUrls = await Promise.all(uploadPromises);

      for (const url of uploadedUrls) {
        if (!frontendImagePaths.includes(url)) {
          newImageEntities.push(
            this.imageRepo.create({
              object_ID: ratingId,
              object_type: 'rating',
              ImagePath: url,
            }),
          );
        }
      }

      await this.imageRepo.save(newImageEntities);
    }

    return updated;
  }

  async getRatingsByGlassColor(glassColorId: number): Promise<{
    average: number;
    count: number;
    ratings: any[];
  }> {
    const ratings = await this.ratingRepo
      .createQueryBuilder('rating')
      .innerJoin(
        OrderDetail,
        'orderDetail',
        'orderDetail.Rating_ID = rating.ID',
      )
      .innerJoin(Order, 'order', 'order.ID = orderDetail.Order_ID')
      .innerJoin(AccountDelivery, 'ad', 'ad.ID = order.Account_Delivery_ID')
      .innerJoin(Account, 'account', 'account.ID = ad.Account_ID')
      .leftJoin(Customer, 'customer', 'customer.Account_ID = account.ID')
      .leftJoin(
        Image,
        'image',
        'image.object_ID = rating.ID AND image.object_type = :type',
        {
          type: 'rating',
        },
      )
      .where('orderDetail.Glass_Color_ID = :glassColorId', { glassColorId })
      .select([
        'rating.ID AS rating_ID',
        'rating.Value AS rating_Value',
        'rating.Comment AS rating_Comment',
        'rating.CreateAt AS rating_CreateAt',
        'image.ID AS image_ID',
        'image.ImagePath AS image_ImagePath',
        'customer.ID AS customer_ID',
        'customer.Name AS customer_Name',
        'customer.Avatar AS customer_Avatar',
      ])
      .getRawMany();

    const grouped = new Map<number, any>();
    let totalValue = 0;

    for (const row of ratings) {
      const ratingId = row.rating_ID;
      if (!grouped.has(ratingId)) {
        grouped.set(ratingId, {
          ID: ratingId,
          Value: row.rating_Value,
          Comment: row.rating_Comment,
          CreateAt: row.rating_CreateAt,
          Customer: {
            ID: row.customer_ID,
            Name: row.customer_Name,
            Avatar: row.customer_Avatar,
          },
          Images: [],
        });
        totalValue += parseFloat(row.rating_Value);
      }
      if (row.image_ID) {
        grouped.get(ratingId).Images.push({
          ID: row.image_ID,
          ImagePath: row.image_ImagePath,
        });
      }
    }

    const groupedArray = Array.from(grouped.values());
    const count = groupedArray.length;
    const average = count > 0 ? parseFloat((totalValue / count).toFixed(2)) : 0;

    return {
      average,
      count,
      ratings: groupedArray,
    };
  }
}
