import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { OrderStatus } from './order_status.entity';

@Entity()
export class OrderRefund {
  @PrimaryColumn() // Khóa chính không tự tăng
  OrderStatus_ID: number;

  @OneToOne(() => OrderStatus, (orderStatus) => orderStatus.Refund)
  @JoinColumn({ name: 'OrderStatus_ID' })
  OrderStatus: OrderStatus;

  @Column({ nullable: true })
  IDAccountCancelReturn: number;

  @Column({ nullable: true, type: 'text' })
  Reason: string;

  @Column({ nullable: true, length: 100 })
  Bank: string;

  @Column({ nullable: true, length: 100 })
  AccountHolder: string;

  @Column({ nullable: true, length: 50 })
  AccountNumber: string;

  @Column({ nullable: true })
  RefundAt: Date;
}
