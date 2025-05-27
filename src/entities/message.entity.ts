import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';

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

  @Column({ type: 'timestamp', nullable: true })
  SeenAt: Date;

  @Column()
  IsEdited: boolean;

  @ManyToOne(() => Conversation)
  @JoinColumn({ name: 'Conversation_ID' })
  Conversation: Conversation;

  @Column()
  Sender_ID: number; // là account ID
}
