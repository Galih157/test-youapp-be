import { Exclude, Expose, Transform } from 'class-transformer';
import { Gender } from '../../../../enums/gender.enum';

@Exclude()
export class ProfileViewModel {
  @Expose()
  displayName?: string;

  @Expose()
  gender?: Gender;

  @Expose()
  @Transform(({ value }: { value: Date | string | undefined }) =>
    value ? new Date(value).toISOString().split('T')[0] : undefined,
  )
  birthday?: string;

  @Expose()
  horoscope?: string;

  @Expose()
  zodiac?: string;

  @Expose()
  height?: number;

  @Expose()
  weight?: number;

  @Expose()
  @Transform(({ value }: { value: string[] | undefined }) => value ?? [])
  interests: string[];
}
