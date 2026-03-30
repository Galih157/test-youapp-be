import { IsMongoId, IsString, IsNotEmpty } from 'class-validator';

export class SendMessageDto {
  @IsMongoId()
  recipientId: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
