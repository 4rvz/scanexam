import { describe, expect, it } from 'vitest';
import { createTemplate, validateTemplateInput } from '../domain/template';

describe('template domain rules', () => {
  it('accepts a valid worksheet configuration', () => {
    expect(validateTemplateInput({ title: 'Math quiz', itemCount: 20, optionCount: 4 })).toEqual([]);
  });

  it('reports all invalid worksheet fields in a stable order', () => {
    expect(validateTemplateInput({ title: '', itemCount: 0, optionCount: 6 })).toEqual([
      'Enter a worksheet title.',
      'Choose between 1 and 200 items.',
      'Choose 4 or 5 answer options.',
    ]);
  });

  it('creates an empty versioned template with matching timestamps', () => {
    const template = createTemplate({ title: 'Science', itemCount: 5, optionCount: 5 });

    expect(template).toMatchObject({
      title: 'Science',
      itemCount: 5,
      optionCount: 5,
      answers: {},
      layoutVersion: 1,
    });
    expect(template.id).toEqual(expect.any(String));
    expect(template.createdAt).toBe(template.updatedAt);
  });
});
