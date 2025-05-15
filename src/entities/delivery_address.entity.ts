import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class DeliveryAddress {
  @PrimaryGeneratedColumn()
  ID: number;

  @Column('text')
  Address: string;

  @Column()
  Province: string;

  @Column({ length: 10 })
  PhoneNumber: string;

  @Column()
  Name: string;
}
