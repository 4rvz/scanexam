import { describe, expect, it } from 'vitest';
import { gradeAnswers } from '../domain/scoring';

describe('answer grading', () => {
  it('counts correct, incorrect, blank, and unclear answers separately', () => {
    const result = gradeAnswers({ 1: 'A', 2: 'B', 3: 'C' }, {
      1: { kind: 'selected', answer: 'A' },
      2: { kind: 'blank' },
      3: { kind: 'unclear', candidates: ['C', 'D'] },
    });

    expect(result).toMatchObject({ correct: 1, total: 3, incorrect: 0, blank: 1, unclear: 1 });
  });

  it('counts a selected answer that differs from the key as incorrect', () => {
    const result = gradeAnswers({ 1: 'A', 2: 'B' }, {
      1: { kind: 'selected', answer: 'C' },
    });

    expect(result).toMatchObject({ correct: 0, total: 2, incorrect: 1, blank: 1, unclear: 0 });
    expect(result.items).toEqual([
      expect.objectContaining({ number: 1, isCorrect: false }),
      expect.objectContaining({ number: 2, detectedAnswer: { kind: 'blank' }, isCorrect: false }),
    ]);
  });
});
