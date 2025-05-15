import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Image {
  @PrimaryGeneratedColumn()
  ID: number;

  @Column()
  object_ID: number;

  @Column()
  object_type: string;

  @Column()
  ImagePath: string;
}
