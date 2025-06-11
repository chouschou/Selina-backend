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
import { Repository } from 'typeorm';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(Rating) private ratingRepo: Repository<Rating>,
    @InjectRepository(OrderDetail)
    private orderDetailRepo: Repository<OrderDetail>,
    @InjectRepository(OrderStatus)
    private orderStatusRepo: Repository<OrderStatus>,
    @InjectRepository(Image) private imageRepo: Repository<Image>,
  ) {}

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
  ) {
    const can = await this.canRate(orderDetailId, userId);
    if (!can)
      throw new BadRequestException('Đơn hàng không đủ điều kiện đánh giá');

    const orderDetail = await this.orderDetailRepo.findOne({
      where: { ID: orderDetailId },
      relations: ['Rating'],
    });

    if (!orderDetail) throw new NotFoundException('Không tìm thấy OrderDetail');

    if (orderDetail.Rating) throw new BadRequestException('Đã có đánh giá');

    const rating = this.ratingRepo.create({
      Value: dto.Value,
      Comment: dto.Comment,
      CreateAt: new Date(),
    });
    const saved = await this.ratingRepo.save(rating);

    orderDetail.Rating = saved;
    await this.orderDetailRepo.save(orderDetail);

    if (dto.ImagePaths?.length) {
      const images = dto.ImagePaths.map((path) =>
        this.imageRepo.create({
          object_ID: saved.ID,
          object_type: 'rating',
          ImagePath: path,
        }),
      );
      await this.imageRepo.save(images);
    }

    return saved;
  }

  async updateRating(ratingId: number, dto: UpdateRatingDto, userId: number) {
    const orderDetail = await this.orderDetailRepo.findOne({
      where: { Rating: { ID: ratingId } },
      relations: [
        'Order',
        'Order.AccountDelivery',
        'Order.AccountDelivery.Account',
      ],
    });
    if (!orderDetail)
      throw new NotFoundException('Không tìm thấy chi tiết đánh giá');

    if (orderDetail.Order.AccountDelivery.Account.ID !== userId)
      throw new ForbiddenException('Bạn không có quyền sửa đánh giá này');

    const can = await this.canRate(orderDetail.ID, userId);
    if (!can)
      throw new BadRequestException(
        'Đơn hàng không còn trong thời gian được chỉnh sửa đánh giá',
      );

    const rating = await this.ratingRepo.findOne({ where: { ID: ratingId } });
    if (!rating) throw new NotFoundException('Không tìm thấy đánh giá');

    if (dto.Value !== undefined) rating.Value = dto.Value;
    if (dto.Comment !== undefined) rating.Comment = dto.Comment;

    const updated = await this.ratingRepo.save(rating);

    if (dto.ImagePaths) {
      if (dto.ImagePaths) {
        const currentImages = await this.imageRepo.find({
          where: {
            object_ID: ratingId,
            object_type: 'rating',
          },
        });

        const currentPaths = currentImages.map((img) => img.ImagePath);
        const newPaths = dto.ImagePaths;

        // Ảnh cần xóa: ảnh cũ không còn trong danh sách mới
        const toDelete = currentImages.filter(
          (img) => !newPaths.includes(img.ImagePath),
        );

        // Ảnh cần thêm: ảnh mới chưa tồn tại trong danh sách cũ
        const toAdd = newPaths.filter((path) => !currentPaths.includes(path));

        if (toDelete.length > 0) {
          await this.imageRepo.remove(toDelete);
        }

        if (toAdd.length > 0) {
          const newImages = toAdd.map((path) =>
            this.imageRepo.create({
              object_ID: ratingId,
              object_type: 'rating',
              ImagePath: path,
            }),
          );
          await this.imageRepo.save(newImages);
        }
      }
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
