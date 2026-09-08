import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { templateStore } from '../storage/templateStore';
import type { WorksheetTemplate } from '../domain/template';

const template: WorksheetTemplate = {
  id: 'math-quiz',
  title: 'Math quiz',
  itemCount: 2,
  optionCount: 4,
  answers: { 1: 'A', 2: 'D' },
  layoutVersion: 1,
  createdAt: '2026-09-08T00:00:00.000Z',
  updatedAt: '2026-09-08T00:00:00.000Z',
};

afterEach(async () => {
  await templateStore.remove(template.id);
});

describe('template store', () => {
  it('round-trips templates through IndexedDB', async () => {
    await templateStore.put(template);

    await expect(templateStore.get(template.id)).resolves.toEqual(template);
    await expect(templateStore.list()).resolves.toHaveLength(1);
  });

  it('exports and imports a validated JSON backup', () => {
    expect(templateStore.import(templateStore.export(template))).toEqual(template);
  });

  it('rejects invalid backups without changing existing records', async () => {
    await templateStore.put(template);

    expect(() => templateStore.import('{"id":"broken"}')).toThrow();
    await expect(templateStore.get(template.id)).resolves.toEqual(template);
  });

  it('rejects backups with malformed answer options', () => {
    expect(() => templateStore.import(JSON.stringify({ ...template, answers: { 1: 'AA' } }))).toThrow();
  });
});
