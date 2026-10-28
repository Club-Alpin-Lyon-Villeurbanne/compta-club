import { describe, it, expect } from 'vitest';
import { isNoteId } from '@/app/lib/noteId';

describe('isNoteId', () => {
  it('accepts a positive integer', () => {
    expect(isNoteId('1')).toBe(true);
    expect(isNoteId('202')).toBe(true);
  });

  it.each(['', '0', '-1', '01', '1.5', '1e3', '12abc', ' 1', '1 ', '..', '../admin/notes-de-frais', '1/clone', '1?x=1', '%2F', '9007199254740993'])(
    'refuses "%s"',
    (value) => {
      expect(isNoteId(value)).toBe(false);
    }
  );

  it('refuses what is not a string', () => {
    expect(isNoteId(1)).toBe(false);
    expect(isNoteId(undefined)).toBe(false);
    expect(isNoteId(['1'])).toBe(false);
  });
});
