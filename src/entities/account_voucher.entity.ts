import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Account } from './account.entity';
import { Voucher } from './voucher.entity';

@Entity()
export class AccountVoucher {
  @PrimaryGeneratedColumn()
  ID: number;

  @ManyToOne(() => Account, (acc) => acc.AccountVouchers)
  @JoinColumn({ name: 'Account_ID' }) // optional
  Account: Account;

  @ManyToOne(() => Voucher)
  @JoinColumn({ name: 'Voucher_ID' }) // optional
  Voucher: Voucher;

  @Column()
  Status: boolean;
}
