import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Account } from './account.entity';

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  ID: number;

  @Column({ length: 50 })
  Name: string;

  @CreateDateColumn()
  CreateAt: Date;

  @OneToMany(() => Account, (account) => account.Role)
  Accounts: Account[];
}
