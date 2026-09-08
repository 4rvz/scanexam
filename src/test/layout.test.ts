import { describe, expect, it } from 'vitest';
import { getPageLayout } from '../domain/layout';
import type { WorksheetTemplate } from '../domain/template';

function templateWith(overrides: Partial<WorksheetTemplate> = {}): WorksheetTemplate {
  return {
    id: 'template-123',
    title: 'Mathematics',
    itemCount: 20,
    optionCount: 4,
    answers: {},
    layoutVersion: 1,
    createdAt: '2026-09-08T00:00:00.000Z',
    updatedAt: '2026-09-08T00:00:00.000Z',
    ...overrides,
  };
}

describe('shared answer-sheet layout', () => {
  it('places the final question of a 51-item five-option worksheet on page two', () => {
    const layout = getPageLayout(templateWith({ itemCount: 51, optionCount: 5 }), 1);

    expect(layout.questions).toHaveLength(1);
    expect(layout.questions[0]).toMatchObject({
      number: 51,
      bubbles: { A: expect.any(Object), E: expect.any(Object) },
    });
    expect(layout.markers).toHaveLength(4);
  });
});
