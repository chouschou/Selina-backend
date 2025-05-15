import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from 'src/entities/order.entity';
import { OrderDetail } from 'src/entities/order_detail.entity';
import { CreateOrderDto } from 'src/DTO/orders/create-order.dto';
import { AccountDelivery } from 'src/entities/account_delivery.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(OrderDetail)
    private orderDetailRepo: Repository<OrderDetail>,
    @InjectRepository(AccountDelivery)
    private accountDeliveryRepo: Repository<AccountDelivery>,
  ) {}

  async create(
    createOrderDto: CreateOrderDto,
    accountId: number,
  ): Promise<Order> {
    const {
      DeliveryAddressId,
      Total,
      ShippingFee,
      VoucherDiscount,
      Status,
      OrderDetails,
    } = createOrderDto;
    console.log('account Id in service ', accountId);
    // Tìm tất cả các AccountDelivery thuộc account hiện tại
    const accountDelivery = await this.accountDeliveryRepo.findOne({
      where: {
        Account: { ID: accountId },
        DeliveryAddress: { ID: DeliveryAddressId },
      },
      relations: ['Account', 'DeliveryAddress'],
    });

    // Nếu không tìm thấy, nghĩa là địa chỉ không thuộc tài khoản → báo lỗi
    if (!accountDelivery) {
      throw new ForbiddenException(
        'Bạn không có quyền sử dụng địa chỉ giao hàng này.',
      );
    }

    // Tạo order
    const order = this.orderRepo.create({
      AccountDelivery: accountDelivery,
      Total,
      ShippingFee,
      VoucherDiscount,
      Status,
    });

    const savedOrder = await this.orderRepo.save(order);

    // Tạo order details
    const details = OrderDetails.map((detail) =>
      this.orderDetailRepo.create({
        Order: savedOrder,
        GlassColor: { ID: detail.GlassColorId },
        Quantity: detail.Quantity,
        Price: detail.Price,
        Discount: detail.Discount,
      }),
    );

    await this.orderDetailRepo.save(details);

    return savedOrder;
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepo.find({
      relations: [
        'AccountDelivery',
        'AccountDelivery.Account',
        'AccountDelivery.DeliveryAddress',
        'OrderDetails',
        'OrderDetails.GlassColor',
      ],
    });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { ID: id },
      relations: [
        'AccountDelivery',
        'AccountDelivery.Account',
        'AccountDelivery.DeliveryAddress',
        'OrderDetails',
        'OrderDetails.GlassColor',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }
}
