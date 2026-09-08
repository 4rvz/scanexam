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
  if (hasDuplicateAnswerKeys(json)) throw new Error('Invalid template backup.');
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

function hasDuplicateAnswerKeys(json: string): boolean {
  return new JsonKeyScanner(json).hasDuplicateAnswerKeys();
}

class JsonKeyScanner {
  private position = 0;

  constructor(private readonly json: string) {}

  hasDuplicateAnswerKeys(): boolean {
    this.skipWhitespace();
    if (this.peek() !== '{') return false;
    return this.scanObject(true);
  }

  private scanValue(): boolean {
    this.skipWhitespace();
    if (this.peek() === '{') return this.scanObject(false);
    if (this.peek() === '[') return this.scanArray();
    if (this.peek() === '"') {
      this.scanString();
      return false;
    }

    while (this.position < this.json.length && !',]} \t\r\n'.includes(this.peek())) this.position += 1;
    return false;
  }

  private scanObject(isRootObject: boolean): boolean {
    this.position += 1;
    this.skipWhitespace();
    if (this.consume('}')) return false;

    const answerKeys = new Set<string>();
    while (this.position < this.json.length) {
      const key = this.scanString();
      this.skipWhitespace();
      this.consume(':');
      this.skipWhitespace();

      if (isRootObject && key === 'answers' && this.peek() === '{') {
        if (this.scanAnswerObject(answerKeys)) return true;
      } else if (this.scanValue()) {
        return true;
      }

      this.skipWhitespace();
      if (this.consume('}')) return false;
      this.consume(',');
      this.skipWhitespace();
    }

    return false;
  }

  private scanAnswerObject(answerKeys: Set<string>): boolean {
    this.position += 1;
    this.skipWhitespace();
    if (this.consume('}')) return false;

    while (this.position < this.json.length) {
      const key = this.scanString();
      if (answerKeys.has(key)) return true;
      answerKeys.add(key);
      this.skipWhitespace();
      this.consume(':');
      if (this.scanValue()) return true;
      this.skipWhitespace();
      if (this.consume('}')) return false;
      this.consume(',');
      this.skipWhitespace();
    }

    return false;
  }

  private scanArray(): boolean {
    this.position += 1;
    this.skipWhitespace();
    if (this.consume(']')) return false;

    while (this.position < this.json.length) {
      if (this.scanValue()) return true;
      this.skipWhitespace();
      if (this.consume(']')) return false;
      this.consume(',');
      this.skipWhitespace();
    }

    return false;
  }

  private scanString(): string {
    const start = this.position;
    this.position += 1;
    while (this.position < this.json.length) {
      const character = this.json[this.position++];
      if (character === '"') return JSON.parse(this.json.slice(start, this.position));
      if (character === '\\') this.position += 1;
    }

    throw new SyntaxError('Unterminated JSON string.');
  }

  private skipWhitespace(): void {
    while (' \t\r\n'.includes(this.peek())) this.position += 1;
  }

  private consume(character: string): boolean {
    if (this.peek() !== character) return false;
    this.position += 1;
    return true;
  }

  private peek(): string {
    return this.json[this.position] ?? '';
  }
}
