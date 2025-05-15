import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { GlassColor } from './glass_color.entity';
import { Rating } from './rating.entity';

@Entity()
export class OrderDetail {
  @PrimaryGeneratedColumn()
  ID: number;

  @ManyToOne(() => Order, (order) => order.OrderDetails)
  @JoinColumn({ name: 'Order_ID' })
  Order: Order;

  @ManyToOne(() => GlassColor)
  @JoinColumn({ name: 'Glass_Color_ID' })
  GlassColor: GlassColor;

  @Column()
  Quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  Price: number;

  @Column('decimal', { precision: 5, scale: 2 })
  Discount: number;

  @ManyToOne(() => Rating, { nullable: true })
  @JoinColumn({ name: 'Rating_ID' })
  Rating: Rating;
}
