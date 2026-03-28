import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ChineseZodiacYearDocument = HydratedDocument<ChineseZodiacYear>;

/**
 * Stores one Chinese lunisolar year as a Gregorian date range.
 * The range runs from the first day of Chinese New Year (inclusive) to
 * the day before the following Chinese New Year (inclusive), so a
 * birthday can be resolved with:
 *   { start: { $lte: birthday }, end: { $gte: birthday } }
 */
@Schema({ collection: 'chinese_zodiac_years', timestamps: false })
export class ChineseZodiacYear {
  /** Gregorian date of Chinese New Year (start of this zodiac year). */
  @Prop({ required: true, unique: true })
  start: Date;

  /** Last Gregorian day of this zodiac year (day before next CNY). */
  @Prop({ required: true })
  end: Date;

  /** Zodiac animal name, e.g. "Rat", "Ox", …, "Pig". */
  @Prop({ required: true })
  animal: string;
}

export const ChineseZodiacYearSchema =
  SchemaFactory.createForClass(ChineseZodiacYear);

// Speed up range queries on birthday look-ups
ChineseZodiacYearSchema.index({ start: 1, end: 1 });
