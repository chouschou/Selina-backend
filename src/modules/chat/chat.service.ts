import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Conversation } from 'src/entities/conversation.entity';
import { Message } from 'src/entities/message.entity';
import { In, Not, Repository } from 'typeorm';
@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    @InjectRepository(Conversation)
    private conversationRepo: Repository<Conversation>,
  ) {}

  async findConversation(data: {
    customerId: number;
    storeId: number;
  }): Promise<Conversation | null> {
    // Tìm conversation giữa customer và store
    const conversation = await this.conversationRepo.findOne({
      where: {
        Customer: { ID: data.customerId },
        Store: { ID: data.storeId },
      },
    });
    return conversation;
  }

  async saveMessage(data: {
    customerId: number;
    content: string;
    senderId: number;
    conversationId?: number;
  }): Promise<Message> {
    let conversation: Conversation | null = null;
    const storeId = 1;

    if (data.conversationId) {
      conversation = await this.conversationRepo.findOne({
        where: { ID: data.conversationId },
      });
      if (!conversation) {
        throw new Error('Conversation không tồn tại');
      }
    } else {
      // Nếu không truyền conversationId thì tìm hoặc tạo conversation
      conversation = await this.findConversation({
        customerId: data.customerId,
        storeId: storeId,
      });

      if (!conversation) {
        conversation = this.conversationRepo.create({
          Customer: { ID: data.customerId },
          Store: { ID: storeId },
        });
        conversation = await this.conversationRepo.save(conversation);
      }
    }

    const message = this.messageRepo.create({
      Content: data.content,
      SendAt: new Date(),
      IsSeen: false,
      Conversation: conversation,
      Sender_ID: data.senderId,
    });

    return this.messageRepo.save(message);
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return this.messageRepo.find({
      where: {
        Conversation: { ID: conversationId },
      },
      order: { SendAt: 'ASC' },
      relations: ['Conversation'],
    });
  }

  // async countUnreadMessages(
  //   idUser: number,
  //   accountId: number,
  //   role: 'customer' | 'store',
  // ): Promise<number> {
  //   let conversations: Conversation[];

  //   if (role === 'customer') {
  //     conversations = await this.conversationRepo.find({
  //       where: { Customer: { ID: idUser } },
  //       select: ['ID'],
  //     });
  //   } else if (role === 'store') {
  //     conversations = await this.conversationRepo.find({
  //       where: { Store: { ID: idUser } },
  //       select: ['ID'],
  //     });
  //   } else {
  //     return 0;
  //   }

  //   if (conversations.length === 0) {
  //     return 0;
  //   }

  //   const conversationIds = conversations.map((c) => c.ID);

  //   const count = await this.messageRepo.count({
  //     where: {
  //       Conversation: { ID: In(conversationIds) },
  //       IsSeen: false,
  //       Sender_ID: Not(accountId),
  //     },
  //   });

  //   return count;
  // }

  async countUnreadMessages(
    idUser: number,
    accountId: number,
    role: 'customer' | 'store',
  ): Promise<
    | number
    | {
        totalUnreadCount: number;
        perConversation: { conversationId: number; unreadCount: number }[];
      }
  > {
    let conversations: Conversation[];

    if (role === 'customer') {
      conversations = await this.conversationRepo.find({
        where: { Customer: { ID: idUser } },
        select: ['ID'],
      });
    } else if (role === 'store') {
      conversations = await this.conversationRepo.find({
        where: { Store: { ID: idUser } },
        select: ['ID'],
      });
    } else {
      return 0;
    }

    if (conversations.length === 0) {
      return role === 'store'
        ? { totalUnreadCount: 0, perConversation: [] }
        : 0;
    }

    const conversationIds = conversations.map((c) => c.ID);

    const [totalUnreadCount, perConversationCounts] = await Promise.all([
      this.messageRepo.count({
        where: {
          Conversation: { ID: In(conversationIds) },
          IsSeen: false,
          Sender_ID: Not(accountId),
        },
      }),
      this.messageRepo
        .createQueryBuilder('message')
        .select('message.Conversation_ID', 'conversationId')
        .addSelect('COUNT(*)', 'unreadCount')
        .where('message.Conversation_ID IN (:...ids)', { ids: conversationIds })
        .andWhere('message.IsSeen = false')
        .andWhere('message.Sender_ID != :accountId', { accountId })
        .groupBy('message.Conversation_ID')
        .getRawMany(),
    ]);

    if (role === 'store') {
      return {
        totalUnreadCount,
        perConversation: perConversationCounts.map((c) => ({
          conversationId: +c.conversationId,
          unreadCount: +c.unreadCount,
        })),
      };
    }

    return totalUnreadCount;
  }

  async markMessagesAsRead(
    conversationId: number,
    readerId: number,
  ): Promise<void> {
    await this.messageRepo
      .createQueryBuilder()
      .update(Message)
      .set({
        IsSeen: true,
        SeenAt: () => 'CURRENT_TIMESTAMP',
      })
      .where('Conversation_ID = :conversationId', { conversationId })
      .andWhere('Sender_ID != :readerId', { readerId })
      .andWhere('IsSeen = false')
      .execute();
  }

  async editMessageIfAllowed(
    messageId: number,
    newContent: string,
    editorId: number,
  ): Promise<Message | null> {
    const message = await this.messageRepo.findOne({
      where: { ID: messageId },
      relations: ['Conversation'],
    });

    if (!message) throw new Error('Tin nhắn không tồn tại');
    if (message.Sender_ID !== editorId)
      throw new Error('Không được phép chỉnh sửa');

    const now = new Date();
    const sentTime = new Date(message.SendAt);
    const diffMs = now.getTime() - sentTime.getTime();

    if (diffMs > 5 * 60 * 1000)
      throw new Error('Chỉ có thể chỉnh sửa trong vòng 5 phút');

    message.Content = newContent;
    message.IsEdited = true;
    return await this.messageRepo.save(message);
  }

  async getAllConversationsForStore(storeId: number) {
    const conversations = await this.conversationRepo.find({
      where: { Store: { ID: storeId } },
      relations: ['Customer', 'Customer.Account'],
    });

    const result = await Promise.all(
      conversations.map(async (conv) => {
        const messages = await this.messageRepo.find({
          where: { Conversation: { ID: conv.ID } },
          order: { SendAt: 'ASC' },
        });

        return {
          ID: conv.ID,
          Customer: {
            ID: conv.Customer.ID,
            Name: conv.Customer.Name,
            Email: conv.Customer.Email,
            PhoneNumber: conv.Customer.PhoneNumber,
            Gender: conv.Customer.Gender,
            DateOfBirth: conv.Customer.DateOfBirth,
            Avatar: conv.Customer.Avatar,
          },
          Messages: messages,
        };
      }),
    );

    return result;
  }
}
