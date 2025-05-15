import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity()
export class OrderStatus {
  @PrimaryGeneratedColumn()
  ID: number;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'Order_ID' })
  Order: Order;

  @Column({ length: 100 })
  TransactionCode: string;

  @Column({ length: 50 })
  Status: string;

  @Column()
  CreateAt: Date;

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
