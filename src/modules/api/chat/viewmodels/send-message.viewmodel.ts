import { Exclude, Expose, Type } from 'class-transformer';
import { ChatRoomViewModel } from './chat-room.viewmodel';
import { MessageViewModel } from './message.viewmodel';

@Exclude()
export class SendMessageViewModel {
  @Expose()
  @Type(() => MessageViewModel)
  message: MessageViewModel;

  @Expose()
  @Type(() => ChatRoomViewModel)
  chatRoom: ChatRoomViewModel;
}
