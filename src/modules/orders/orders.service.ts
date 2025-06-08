import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order } from 'src/entities/order.entity';
import { OrderDetail } from 'src/entities/order_detail.entity';
import { CreateOrderDto } from 'src/DTO/orders/create-order.dto';
import { AccountDelivery } from 'src/entities/account_delivery.entity';
import { UpdateOrderStatusDto } from 'src/DTO/orders/update-order-status.dto';
import { OrderStatus } from 'src/entities/order_status.entity';
import { OrderRefund } from 'src/entities/order_refund.entity';
import { UpdateOrderRefundDto } from 'src/DTO/orders/update-order-refund.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(OrderDetail)
    private orderDetailRepo: Repository<OrderDetail>,
    @InjectRepository(AccountDelivery)
    private accountDeliveryRepo: Repository<AccountDelivery>,
    @InjectRepository(OrderStatus)
    private orderStatusRepo: Repository<OrderStatus>,
    @InjectRepository(OrderRefund)
    private orderRefundRepo: Repository<OrderRefund>,
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

  async findAll(): Promise<
    {
      id: number;
      customerName: string;
      orderDate: string;
      total: number;
      status: string;
      isPaid: boolean;
      isRefunded: boolean;
    }[]
  > {
    const orders = await this.orderRepo.find({
      relations: [
        'AccountDelivery',
        'AccountDelivery.Account',
        'AccountDelivery.DeliveryAddress',
        'OrderStatuses',
        'OrderStatuses.Refund',
      ],
    });

    return orders.map((order) => {
      const customerName = `${order.AccountDelivery.DeliveryAddress.Name}`;

      const waitingStatus = order.OrderStatuses.find(
        (s) => s.Status === 'waiting',
      );
      const orderDate = waitingStatus
        ? `${new Date(waitingStatus.CreateAt).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          })}, ${new Date(waitingStatus.CreateAt).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}`
        : '';

      const isPaid = order.OrderStatuses.some((s) => s.Status === 'paid');
      // const isPaid = waitingStatus?.TransactionCode ? true : false;
      const refundedStatus = order?.OrderStatuses.find(
        (o) => o.Refund !== null,
      );
      console.log('order?.OrderStatuses', order?.OrderStatuses);
      const isRefunded = refundedStatus?.Refund?.RefundAt ? true : false;

      return {
        id: order.ID,
        customerName,
        orderDate,
        total: Number(order.Total),
        status: order.Status,
        isPaid,
        isRefunded,
      };
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
        'OrderDetails.GlassColor.Glass',
        'OrderDetails.GlassColor',
        'OrderStatuses',
        'OrderStatuses.Refund',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async updateStatus(
    orderId: number,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderStatus> {
    const order = await this.orderRepo.findOne({ where: { ID: orderId } });

    if (!order) throw new NotFoundException('Order not found');

    const newStatus = this.orderStatusRepo.create({
      Order: order,
      Status: dto.Status,
      TransactionCode: dto.TransactionCode ?? '',
      CreateAt: new Date(),
    });

    // Cập nhật trạng thái cuối cùng trong bảng Order (để hiển thị nhanh)
    order.Status = dto.Status;
    await this.orderRepo.save(order);

    return this.orderStatusRepo.save(newStatus);
  }

  async updateRefundStatus(
    orderId: number,
    dto: UpdateOrderRefundDto,
  ): Promise<OrderRefund> {
    const refundStatus = await this.orderStatusRepo.findOne({
      where: {
        Order: { ID: orderId },
        Status: In(['canceled', 'returned']),
      },
      relations: ['Refund'],
    });

    if (!refundStatus) {
      throw new NotFoundException(
        `Không tìm thấy trạng thái 'canceled' hoặc 'returned' cho đơn hàng ID ${orderId}`,
      );
    }

    let refund: OrderRefund;

    if (refundStatus.Refund) {
      // Cập nhật nếu đã có
      refund = Object.assign(refundStatus.Refund, dto);
    } else {
      // Tạo mới nếu chưa có
      refund = this.orderRefundRepo.create({
        OrderStatus: refundStatus,
        OrderStatus_ID: refundStatus.ID,
        ...dto,
      });
    }

    return this.orderRefundRepo.save(refund);
  }
}
