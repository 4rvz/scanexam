import { openDB } from 'idb';
import type { DBSchema } from 'idb';
import type { AnswerOption, OptionCount, WorksheetTemplate } from '../domain/template';

interface ScanexamDb extends DBSchema {
  templates: {
    key: string;
    value: WorksheetTemplate;
  };
}

const dbPromise = openDB<ScanexamDb>('scanexam', 1, {
  upgrade(db) {
    db.createObjectStore('templates', { keyPath: 'id' });
  },
});

export async function listTemplates(): Promise<WorksheetTemplate[]> {
  return (await dbPromise).getAll('templates');
}

export async function getTemplate(id: string): Promise<WorksheetTemplate | undefined> {
  return (await dbPromise).get('templates', id);
}

export async function putTemplate(template: WorksheetTemplate): Promise<void> {
  await (await dbPromise).put('templates', template);
}

export async function removeTemplate(id: string): Promise<void> {
  await (await dbPromise).delete('templates', id);
}

export function exportTemplate(template: WorksheetTemplate): string {
  const { id, title, itemCount, optionCount, answers, layoutVersion, createdAt, updatedAt } = template;
  return JSON.stringify({ id, title, itemCount, optionCount, answers, layoutVersion, createdAt, updatedAt });
}

export function importTemplate(json: string): WorksheetTemplate {
  return validateImportedTemplate(JSON.parse(json));
}

export const templateStore = {
  list: listTemplates,
  get: getTemplate,
  put: putTemplate,
  remove: removeTemplate,
  export: exportTemplate,
  import: importTemplate,
};

function validateImportedTemplate(value: unknown): WorksheetTemplate {
  if (!isRecord(value)) {
    throw new Error('Invalid template backup.');
  }

  const { id, title, itemCount, optionCount, answers, layoutVersion, createdAt, updatedAt } = value;
  if (typeof id !== 'string'
    || typeof title !== 'string'
    || typeof itemCount !== 'number' || !Number.isInteger(itemCount) || itemCount < 1 || itemCount > 200
    || (optionCount !== 4 && optionCount !== 5)
    || layoutVersion !== 1
    || typeof createdAt !== 'string'
    || typeof updatedAt !== 'string'
    || !isAnswerRecord(answers, itemCount, optionCount)) {
    throw new Error('Invalid template backup.');
  }

  return { id, title, itemCount, optionCount, answers, layoutVersion, createdAt, updatedAt };
}

function isAnswerRecord(value: unknown, itemCount: number, optionCount: OptionCount): value is Record<number, AnswerOption> {
  if (!isRecord(value)) return false;

  const questionNumbers = new Set<number>();
  return Object.entries(value).every(([question, answer]) => {
    const questionNumber = Number(question);
    const isValid = Number.isInteger(questionNumber)
      && String(questionNumber) === question
      && questionNumber >= 1
      && questionNumber <= itemCount
      && typeof answer === 'string'
      && ['A', 'B', 'C', 'D', 'E'].slice(0, optionCount).includes(answer as AnswerOption);
    if (!isValid || questionNumbers.has(questionNumber)) return false;
    questionNumbers.add(questionNumber);
    return true;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
