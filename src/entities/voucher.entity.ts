import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Voucher {
  @PrimaryGeneratedColumn()
  ID: number;

  @Column()
  Name: string;

  @Column('text')
  Description: string;

  @Column()
  StartDate: Date;

  @Column()
  EndDate: Date;

  @Column('decimal')
  VoucherPercentage: number;

  @Column('decimal')
  MaxDiscountValue: number;

  @Column('decimal')
  MinOrderValue: number;

  @Column()
  RemainingQuantity: number;
}
