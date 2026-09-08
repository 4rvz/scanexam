export type OptionCount = 4 | 5;
export type AnswerOption = 'A' | 'B' | 'C' | 'D' | 'E';

export interface WorksheetTemplate {
  id: string;
  title: string;
  itemCount: number;
  optionCount: OptionCount;
  answers: Record<number, AnswerOption>;
  layoutVersion: 1;
  createdAt: string;
  updatedAt: string;
}

export function validateTemplateInput(input: {
  title: string;
  itemCount: number;
  optionCount: number;
}): string[] {
  const errors: string[] = [];

  if (!input.title.trim()) errors.push('Enter a worksheet title.');
  if (!Number.isInteger(input.itemCount) || input.itemCount < 1 || input.itemCount > 200) {
    errors.push('Choose between 1 and 200 items.');
  }
  if (input.optionCount !== 4 && input.optionCount !== 5) {
    errors.push('Choose 4 or 5 answer options.');
  }

  return errors;
}

export function createTemplate(input: {
  title: string;
  itemCount: number;
  optionCount: OptionCount;
}): WorksheetTemplate {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    ...input,
    answers: {},
    layoutVersion: 1,
    createdAt: now,
    updatedAt: now,
  };
}
