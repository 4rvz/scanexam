import { describe, expect, it } from 'vitest';
import { parseAnswerKeyCsv } from '../domain/csv';

describe('answer key CSV import', () => {
  it('normalizes a headered answer key to uppercase options', () => {
    expect(parseAnswerKeyCsv('question,answer\n1,b\n2,D', 2, 4)).toEqual({
      ok: true,
      answers: { 1: 'B', 2: 'D' },
    });
  });

  it('rejects an entire import when it has duplicate, out-of-range, and missing questions', () => {
    expect(parseAnswerKeyCsv('1,A\n1,B\n3,E', 2, 4)).toEqual({
      ok: false,
      errors: [
        'Row 2: question 1 is duplicated.',
        'Row 3: question 3 must be between 1 and 2.',
        'Questions 2 are missing.',
      ],
    });
  });

  it('rejects answer options that exceed the template option count', () => {
    expect(parseAnswerKeyCsv('1,E', 1, 4)).toEqual({
      ok: false,
      errors: ['Row 1: answer E is invalid for 4 options.', 'Questions 1 are missing.'],
    });
  });

  it('rejects malformed multi-letter answer options', () => {
    expect(parseAnswerKeyCsv('1,AA', 1, 4)).toEqual({
      ok: false,
      errors: ['Row 1: answer AA is invalid for 4 options.', 'Questions 1 are missing.'],
    });
  });
});
