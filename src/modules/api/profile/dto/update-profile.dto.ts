import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Gender } from '../../../../enums/gender.enum';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  displayName?: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsDateString()
  @IsOptional()
  birthday?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  height?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  weight?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interests?: string[];
}
