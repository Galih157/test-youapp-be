import { getHoroscope } from './astrology';

describe('getHoroscope', () => {
  // [sign, month, day] — start, middle, end for each sign
  const cases: [string, number, number][] = [
    // Aries: Mar 21 – Apr 19
    ['Aries', 3, 21],
    ['Aries', 4, 5],
    ['Aries', 4, 19],
    // Taurus: Apr 20 – May 20
    ['Taurus', 4, 20],
    ['Taurus', 5, 5],
    ['Taurus', 5, 20],
    // Gemini: May 21 – Jun 20
    ['Gemini', 5, 21],
    ['Gemini', 6, 5],
    ['Gemini', 6, 20],
    // Cancer: Jun 21 – Jul 22
    ['Cancer', 6, 21],
    ['Cancer', 7, 5],
    ['Cancer', 7, 22],
    // Leo: Jul 23 – Aug 22
    ['Leo', 7, 23],
    ['Leo', 8, 5],
    ['Leo', 8, 22],
    // Virgo: Aug 23 – Sep 22
    ['Virgo', 8, 23],
    ['Virgo', 9, 5],
    ['Virgo', 9, 22],
    // Libra: Sep 23 – Oct 22
    ['Libra', 9, 23],
    ['Libra', 10, 5],
    ['Libra', 10, 22],
    // Scorpio: Oct 23 – Nov 21
    ['Scorpio', 10, 23],
    ['Scorpio', 11, 5],
    ['Scorpio', 11, 21],
    // Sagittarius: Nov 22 – Dec 21
    ['Sagittarius', 11, 22],
    ['Sagittarius', 12, 5],
    ['Sagittarius', 12, 21],
    // Capricorn: Dec 22 – Jan 19
    ['Capricorn', 12, 22],
    ['Capricorn', 1, 5],
    ['Capricorn', 1, 19],
    // Aquarius: Jan 20 – Feb 18
    ['Aquarius', 1, 20],
    ['Aquarius', 2, 5],
    ['Aquarius', 2, 18],
    // Pisces: Feb 19 – Mar 20
    ['Pisces', 2, 19],
    ['Pisces', 3, 5],
    ['Pisces', 3, 20],
  ];

  test.each(cases)('returns %s for month %i day %i', (sign, month, day) => {
    const date = new Date(2000, month - 1, day);
    expect(getHoroscope(date)).toBe(sign);
  });

  it('throws for an invalid date', () => {
    // Simulate a Date with an impossible month value (13) to force the unreachable branch
    const invalid = new Date(2000, 0, 1);
    jest.spyOn(invalid, 'getMonth').mockReturnValue(12); // month = 13 inside function
    jest.spyOn(invalid, 'getDate').mockReturnValue(1);
    expect(() => getHoroscope(invalid)).toThrow('Unknown horoscope');
  });
});

