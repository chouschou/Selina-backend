import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { GlassColor } from './glass_color.entity';

@Entity()
export class Glass {
  @PrimaryGeneratedColumn()
  ID: number;

  @Column()
  Category: string;

  @Column()
  Shape: string;

  @Column()
  Material: string;

  @Column('text')
  Description: string;

  @Column()
  Age: string;

  @OneToMany(() => GlassColor, (gc) => gc.Glass)
  GlassColors: GlassColor[];
}
