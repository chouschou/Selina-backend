import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { AccountDelivery } from './account_delivery.entity';
import { OrderDetail } from './order_detail.entity';
import { OrderStatus } from './order_status.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  ID: number;

  @ManyToOne(() => AccountDelivery)
  @JoinColumn({ name: 'Account_Delivery_ID' })
  AccountDelivery: AccountDelivery;

  @Column('decimal', { precision: 10, scale: 2 })
  Total: number;

  @Column('decimal', { precision: 10, scale: 2 })
  ShippingFee: number;

  @Column('decimal', { precision: 10, scale: 2 })
  VoucherDiscount: number;

  @Column({ length: 50 })
  Status: string;

  @OneToMany(() => OrderDetail, (detail) => detail.Order)
  OrderDetails: OrderDetail[];

  @OneToMany(() => OrderStatus, (status) => status.Order, { cascade: true })
  OrderStatuses: OrderStatus[];
}
