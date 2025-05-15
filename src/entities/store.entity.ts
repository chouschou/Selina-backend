import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Account } from './account.entity';

@Entity()
export class Store {
  @PrimaryGeneratedColumn()
  ID: number;

  @Column()
  Name: string;

  @Column()
  Avatar: string;

  @OneToOne(() => Account, (account) => account.Store)
  @JoinColumn({ name: 'Account_ID' })
  Account: Account;
}
