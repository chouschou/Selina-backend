import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Conservation } from './conservation.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  ID: number;

  @Column('text')
  Content: string;

  @Column()
  SendAt: Date;

  @Column()
  IsSeen: boolean;

  @Column({ nullable: true })
  SeenAt: Date;

  @ManyToOne(() => Conservation)
  @JoinColumn({ name: 'Conversation_ID' })
  Conversation: Conservation;

  @Column()
  Sender_ID: number;
}
