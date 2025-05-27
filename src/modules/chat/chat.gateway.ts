import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { Get, Param } from '@nestjs/common';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody()
    data: { customerId: number; content: string; senderId: number },
    @ConnectedSocket() client: Socket,
  ) {
    // Lưu tin nhắn của người dùng
    const message = await this.chatService.saveMessage(data);
    const conversationId = message.Conversation.ID;

    // Gửi tin nhắn đến các client trong phòng conversation
    this.server.to(String(conversationId)).emit('receive_message', message);
    this.server.emit('message_changed', { conversationId });

    // Client join phòng conversation nếu chưa join
    await client.join(String(conversationId));

    // Nếu tin nhắn từ khách hàng (senderId != cửa hàng)
    if (data.senderId !== 3) {
      setTimeout(() => {
        void (async () => {
          const autoReplyData = {
            customerId: data.customerId,
            content:
              'Cảm ơn bạn đã liên hệ. Nhân viên tư vấn sẽ phản hồi trong thời gian sớm nhất.',
            senderId: 3,
          };

          const autoReplyMessage =
            await this.chatService.saveMessage(autoReplyData);

          this.server
            .to(String(conversationId))
            .emit('receive_message', autoReplyMessage);
        })();
      }, 2000);
    }
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @MessageBody() data: { conversationId: number },
    @ConnectedSocket() client: Socket,
  ) {
    await client.join(String(data.conversationId));
  }

  @SubscribeMessage('get_conversation_history')
  async handleGetConversationHistory(
    @MessageBody() conversationId: number,
    @ConnectedSocket() client: Socket,
  ) {
    const messages =
      await this.chatService.getMessagesByConversation(conversationId);
    client.emit('conversation_history', messages);
  }
  @SubscribeMessage('get_conversation')
  async handleGetConversation(
    @MessageBody()
    data: { customerId: number; storeId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const conversation = await this.chatService.findConversation(data);
    client.emit('receive_conversation', conversation);
  }

  @SubscribeMessage('count_unread_messages')
  async handleCountUnreadMessages(
    @MessageBody()
    data: { idUser: number; accountId: number; role: 'customer' | 'store' },
    @ConnectedSocket() client: Socket,
  ) {
    const count = await this.chatService.countUnreadMessages(
      data.idUser,
      data.accountId,
      data.role,
    );
    client.emit('unread_messages_count', count);
  }

  @SubscribeMessage('mark_messages_read')
  async handleMarkMessagesRead(
    @MessageBody() data: { conversationId: number; readerId: number },
    @ConnectedSocket() client: Socket,
  ) {
    await this.chatService.markMessagesAsRead(
      data.conversationId,
      data.readerId,
    );

    // Lấy lại danh sách tin nhắn sau cập nhật
    const updatedMessages = await this.chatService.getMessagesByConversation(
      data.conversationId,
    );

    // Gửi lại cho tất cả client trong phòng để cập nhật UI
    this.server
      .to(String(data.conversationId))
      .emit('conversation_history', updatedMessages);
    this.server.emit('message_changed');
  }
  @SubscribeMessage('edit_message')
  async handleEditMessage(
    @MessageBody()
    data: { messageId: number; newContent: string; editorId: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const updatedMessage = await this.chatService.editMessageIfAllowed(
        data.messageId,
        data.newContent,
        data.editorId,
      );

      if (updatedMessage) {
        const conversationId = updatedMessage.Conversation.ID;
        this.server
          .to(String(conversationId))
          .emit('message_edited', updatedMessage);
        this.server.emit('message_changed');
      } else {
        client.emit('edit_message_failed', 'Không thể chỉnh sửa tin nhắn.');
      }
    } catch (error) {
      client.emit('edit_message_failed', error.message);
    }
  }

  @SubscribeMessage('get_store_conversations')
  async handleGetStoreConversations(
    @MessageBody() data: { storeId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const conversations = await this.chatService.getAllConversationsForStore(
      data.storeId,
    );

    client.emit('store_conversations', conversations);
  }
}
