import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Role } from './role.entity';
import { Customer } from './customer.entity';
import { Store } from './store.entity';
import { AccountDelivery } from './account_delivery.entity';
import { AccountVoucher } from './account_voucher.entity';
import { JoinColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity()
export class Account {
  @PrimaryGeneratedColumn()
  ID: number;

  @Column({ unique: true })
  Username: string;

  @Exclude()
  @Column()
  Password: string;

  @ManyToOne(() => Role, (role) => role.Accounts)
  @JoinColumn({ name: 'Role_ID' })
  Role: Role;

  @OneToOne(() => Customer, (customer) => customer.Account)
  Customer: Customer;

  @OneToOne(() => Store, (store) => store.Account)
  Store: Store;

  @OneToMany(() => AccountDelivery, (ad) => ad.Account)
  AccountDeliveries: AccountDelivery[];

  @OneToMany(() => AccountVoucher, (av) => av.Account)
  AccountVouchers: AccountVoucher[];
}
