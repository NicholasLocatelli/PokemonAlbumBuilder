import { describe, it, expect } from 'vitest';
import { cn } from '../client/src/lib/utils';

describe('Utility functions', () => {
  describe('cn - class name utility', () => {
    it('should merge class names correctly', () => {
      const result = cn('class1', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toBe('base-class active-class');
    });

    it('should filter out falsy values', () => {
      const result = cn('base-class', false && 'should-not-appear', null, undefined, 0, 'should-appear');
      expect(result).toBe('base-class should-appear');
    });

    it('should handle tailwind conditional classes', () => {
      const result = cn(
        'base-class',
        { 'dark:bg-gray-800': true, 'bg-white': false }
      );
      expect(result).toContain('base-class');
      expect(result).toContain('dark:bg-gray-800');
      expect(result).not.toContain('bg-white');
    });
  });
});