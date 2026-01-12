import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('utils', () => {
    describe('cn', () => {
        it('should merge class names correctly', () => {
            const result = cn('c-1', 'c-2');
            expect(result).toBe('c-1 c-2');
        });

        it('should handle tailwind class conflicts', () => {
            // p-4 should override p-2
            const result = cn('p-2', 'p-4');
            expect(result).toBe('p-4');
        });

        it('should handle conditional classes', () => {
            const result = cn('c-1', false && 'c-2', true && 'c-3');
            expect(result).toBe('c-1 c-3');
        });

        it('should handle array inputs', () => {
            const result = cn(['c-1', 'c-2']);
            expect(result).toBe('c-1 c-2');
        });

        it('should handle object inputs', () => {
            const result = cn({ 'c-1': true, 'c-2': false });
            expect(result).toBe('c-1');
        });
    });
});
