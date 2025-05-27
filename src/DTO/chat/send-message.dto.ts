import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class SendMessageDto {
  @IsNumber()
  conversationId: number;

  @IsNumber()
  senderId: number;

  @IsString()
  @IsNotEmpty()
  content: string;
}
