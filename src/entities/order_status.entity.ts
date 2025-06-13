import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Order } from './order.entity';
import { OrderRefund } from './order_refund.entity';

@Entity()
export class OrderStatus {
  @PrimaryGeneratedColumn()
  ID: number;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'Order_ID' })
  Order: Order;

  @Column({ type: 'varchar', length: 100, nullable: true })
  TransactionCode: string | null;

  @Column({ length: 50 })
  Status: string;

  @Column()
  CreateAt: Date;

  // Mối quan hệ 1-1 với bảng hoàn tiền
  @OneToOne(() => OrderRefund, (refund) => refund.OrderStatus, {
    cascade: true,
  })
  Refund?: OrderRefund;
}
