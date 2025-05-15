import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class ShippingFee {
  @PrimaryGeneratedColumn()
  ID: number;

  @Column()
  StoreLocation: string;

  @Column('decimal')
  BasicFee: number;

  @Column('decimal')
  BasicDistance: number;

  @Column('decimal')
  Surcharge: number;

  @Column()
  SurchargeUnit: string;
}
