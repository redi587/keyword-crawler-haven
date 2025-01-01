import { describe, it, expect } from 'vitest';
import { getNextCrawlTime, formatTime } from '../utils';

describe('Utils', () => {
  describe('getNextCrawlTime', () => {
    it('calculates next crawl time correctly', () => {
      const config = {
        check_interval: 30,
        active: true,
        start_time: '09:00',
        end_time: '17:00',
      };

      const nextCrawl = getNextCrawlTime(config);
      expect(nextCrawl).toBeDefined();
    });

    it('returns undefined for inactive configs', () => {
      const config = {
        check_interval: 30,
        active: false,
        start_time: '09:00',
        end_time: '17:00',
      };

      const nextCrawl = getNextCrawlTime(config);
      expect(nextCrawl).toBeUndefined();
    });
  });

  describe('formatTime', () => {
    it('formats time correctly', () => {
      const time = '14:30';
      const formatted = formatTime(time);
      expect(formatted).toBe('14:30');
    });

    it('handles null time', () => {
      const formatted = formatTime(null);
      expect(formatted).toBe('-');
    });

    it('handles invalid time format', () => {
      const time = 'invalid';
      const formatted = formatTime(time);
      expect(formatted).toBe('-');
    });
  });
});