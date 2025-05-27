import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Account } from './account.entity';

@Entity()
export class Customer {
  @PrimaryGeneratedColumn()
  ID: number;

  @Column()
  Email: string;

  @Column()
  Name: string;

  @Column()
  Gender: string;

  @Column()
  PhoneNumber: string;

  @Column('date')
  DateOfBirth: Date;

  @Column({ nullable: true })
  Avatar: string;

  @OneToOne(() => Account, (account) => account.Customer)
  @JoinColumn({ name: 'Account_ID' })
  Account: Account;
}
