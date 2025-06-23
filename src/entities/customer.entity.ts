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

  @Column({ nullable: true })
  Email: string;

  @Column({ nullable: true })
  Name: string;

  @Column({ nullable: true })
  Gender: string;

  @Column({ nullable: true })
  PhoneNumber: string;

  @Column({ nullable: true, type: 'date' })
  DateOfBirth: Date;

  @Column({ nullable: true, type: 'varchar' })
  Avatar!: string | null;

  @OneToOne(() => Account, (account) => account.Customer)
  @JoinColumn({ name: 'Account_ID' })
  Account: Account;
}
