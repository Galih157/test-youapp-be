import { Exclude, Expose, Transform, Type } from 'class-transformer';

@Exclude()
export class MessageViewModel {
  @Expose()
  @Transform(({ obj }: { obj: { _id: unknown } }) => String(obj._id))
  id: string;

  @Expose()
  @Transform(({ obj }: { obj: { chatRoomId: unknown } }) =>
    String(obj.chatRoomId),
  )
  chatRoomId: string;

  @Expose()
  @Transform(({ obj }: { obj: { senderId: unknown } }) => String(obj.senderId))
  senderId: string;

  @Expose()
  @Transform(({ obj }: { obj: { receiverId: unknown } }) =>
    String(obj.receiverId),
  )
  receiverId: string;

  @Expose()
  content: string;

  @Expose()
  @Type(() => Date)
  createdAt: Date;
}
