import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GlassColor } from './glass_color.entity';
import { Account } from './account.entity';

@Entity('Cart')
export class Cart {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => GlassColor, { eager: true }) // eager để tự động load
  @JoinColumn({ name: 'Glass_Color_ID' })
  glassColor: GlassColor;

  @Column()
  quantity: number;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'Account_ID' })
  account: Account;
}
