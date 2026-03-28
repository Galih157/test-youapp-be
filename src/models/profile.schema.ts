import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProfileDocument = HydratedDocument<Profile>;

@Schema({ timestamps: true })
export class Profile {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop()
  displayName?: string;

  @Prop()
  gender?: string;

  @Prop()
  birthday?: Date;

  @Prop()
  horoscope?: string;

  @Prop()
  zodiac?: string;

  @Prop()
  height?: number;

  @Prop()
  weight?: number;

  @Prop({ type: [String], default: [] })
  interests: string[];
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
