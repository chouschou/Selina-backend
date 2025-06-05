import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Glass } from './glass.entity';

@Entity()
export class GlassColor {
  @PrimaryGeneratedColumn()
  ID: number;

  @Column()
  Glass_ID: number;

  @ManyToOne(() => Glass, (glass) => glass.GlassColors)
  @JoinColumn({ name: 'Glass_ID' })
  Glass: Glass;

  @Column({ length: 50 }) Color: string;

  @Column('int') Quantity: number;

  @Column('decimal', { precision: 10, scale: 2 }) Price: number;

  @Column('decimal', { precision: 5, scale: 2 }) Discount: number;

  @Column('text', { nullable: true })
  ModelVirtualTryOn: string | null;

  @Column('text', { nullable: true })
  Image3DPath: string | null;

  @Column({ length: 50 })
  Status: string;
}
