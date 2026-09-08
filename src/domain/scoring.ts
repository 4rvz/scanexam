import type { AnswerOption } from './template';

export type DetectedAnswer =
  | { kind: 'selected'; answer: AnswerOption }
  | { kind: 'blank' }
  | { kind: 'unclear'; candidates: AnswerOption[] };

export interface ItemResult {
  number: number;
  correctAnswer: AnswerOption;
  detectedAnswer: DetectedAnswer;
  isCorrect: boolean;
}

export interface GradeResult {
  items: ItemResult[];
  correct: number;
  total: number;
  incorrect: number;
  blank: number;
  unclear: number;
}

function summarizeItems(items: ItemResult[]): GradeResult {
  let correct = 0;
  let incorrect = 0;
  let blank = 0;
  let unclear = 0;

  for (const item of items) {
    if (item.detectedAnswer.kind === 'blank') blank += 1;
    else if (item.detectedAnswer.kind === 'unclear') unclear += 1;
    else if (item.isCorrect) correct += 1;
    else incorrect += 1;
  }

  return { items, correct, total: items.length, incorrect, blank, unclear };
}

export function gradeAnswers(
  key: Record<number, AnswerOption>,
  detected: Record<number, DetectedAnswer>,
): GradeResult {
  const items = Object.entries(key).map(([number, correctAnswer]) => {
    const questionNumber = Number(number);
    const detectedAnswer = detected[questionNumber] ?? { kind: 'blank' as const };
    return {
      number: questionNumber,
      correctAnswer,
      detectedAnswer,
      isCorrect: detectedAnswer.kind === 'selected' && detectedAnswer.answer === correctAnswer,
    };
  });

  return summarizeItems(items);
}
