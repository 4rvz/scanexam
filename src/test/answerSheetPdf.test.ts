import { describe, expect, it } from 'vitest';
import { createAnswerSheetPdf } from '../pdf/answerSheetPdf';
import type { WorksheetTemplate } from '../domain/template';

function templateWith(overrides: Partial<WorksheetTemplate> = {}): WorksheetTemplate {
  return {
    id: 'template-456',
    title: 'Science',
    itemCount: 20,
    optionCount: 4,
    answers: {},
    layoutVersion: 1,
    createdAt: '2026-09-08T00:00:00.000Z',
    updatedAt: '2026-09-08T00:00:00.000Z',
    ...overrides,
  };
}

describe('answer-sheet PDF generation', () => {
  it('creates a substantial PDF for a 51-item worksheet', async () => {
    const pdf = await createAnswerSheetPdf(templateWith({ itemCount: 51 }));

    expect(pdf.type).toBe('application/pdf');
    expect(pdf.size).toBeGreaterThan(1_000);
  });
});
