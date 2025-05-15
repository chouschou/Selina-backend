import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Rating {
  @PrimaryGeneratedColumn()
  ID: number;

  @Column()
  Value: number;

  @Column('text')
  Comment: string;

  @Column()
  CreateAt: Date;
}
