import type { AnswerOption, OptionCount } from './template';

export type CsvImportResult =
  | { ok: true; answers: Record<number, AnswerOption> }
  | { ok: false; errors: string[] };

export function parseAnswerKeyCsv(
  csv: string,
  itemCount: number,
  optionCount: OptionCount,
): CsvImportResult {
  const rows = csv.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const dataRows = rows[0]?.toLowerCase() === 'question,answer' ? rows.slice(1) : rows;
  return validateCsvRows(dataRows, itemCount, optionCount);
}

function validateCsvRows(
  rows: string[],
  itemCount: number,
  optionCount: OptionCount,
): CsvImportResult {
  const answers: Record<number, AnswerOption> = {};
  const errors: string[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    const columns = row.split(',').map(column => column.trim());
    const question = Number(columns[0]);
    const answer = columns[1]?.toUpperCase();

    if (columns.length !== 2 || !Number.isInteger(question)) {
      errors.push(`Row ${rowNumber}: expected a question number and answer.`);
      return;
    }
    if (question < 1 || question > itemCount) {
      errors.push(`Row ${rowNumber}: question ${question} must be between 1 and ${itemCount}.`);
      return;
    }
    if (question in answers) {
      errors.push(`Row ${rowNumber}: question ${question} is duplicated.`);
      return;
    }
    if (!isValidAnswerOption(answer, optionCount)) {
      errors.push(`Row ${rowNumber}: answer ${answer || '(blank)'} is invalid for ${optionCount} options.`);
      return;
    }

    answers[question] = answer;
  });

  const missing = Array.from({ length: itemCount }, (_, index) => index + 1)
    .filter(question => !(question in answers));
  if (missing.length > 0) errors.push(`Questions ${missing.join(', ')} are missing.`);

  return errors.length > 0 ? { ok: false, errors } : { ok: true, answers };
}

function isValidAnswerOption(answer: string | undefined, optionCount: OptionCount): answer is AnswerOption {
  return answer !== undefined && ['A', 'B', 'C', 'D', 'E'].slice(0, optionCount).includes(answer as AnswerOption);
}
