import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { MessageViewModel } from './message.viewmodel';

@Exclude()
export class ChatRoomViewModel {
  @Expose()
  @Transform(({ obj }: { obj: { _id: unknown } }) => String(obj._id))
  id: string;

  @Expose()
  @Transform(({ obj }: { obj: { participants: unknown[] } }) =>
    (obj.participants ?? []).map(String),
  )
  participants: string[];

  @Expose()
  @Type(() => MessageViewModel)
  lastMessage?: MessageViewModel;

  @Expose()
  @Type(() => Date)
  updatedAt: Date;
}
