import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from './customer.entity';
import { Store } from './store.entity';

@Entity()
export class Conservation {
  @PrimaryGeneratedColumn()
  ID: number;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'Customer_ID' })
  Customer: Customer;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'Store_ID' })
  Store: Store;
}
