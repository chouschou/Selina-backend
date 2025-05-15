import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from './account.entity';
import { DeliveryAddress } from './delivery_address.entity';

@Entity({ name: 'Account_Delivery' })
export class AccountDelivery {
  @PrimaryGeneratedColumn()
  ID: number;

  @ManyToOne(() => Account, (account) => account.AccountDeliveries)
  @JoinColumn({ name: 'Account_ID' })
  Account: Account;

  @ManyToOne(() => DeliveryAddress)
  @JoinColumn({ name: 'Delivery_Address_ID' })
  DeliveryAddress: DeliveryAddress;
}
