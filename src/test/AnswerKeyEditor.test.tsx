import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AnswerKeyEditor } from '../components/AnswerKeyEditor';
import type { WorksheetTemplate } from '../domain/template';

const template: WorksheetTemplate = {
  id: 'unit-1',
  title: 'Unit 1',
  itemCount: 2,
  optionCount: 4,
  answers: {},
  layoutVersion: 1,
  createdAt: '2026-09-08T00:00:00.000Z',
  updatedAt: '2026-09-08T00:00:00.000Z',
};

describe('AnswerKeyEditor', () => {
  it('shows CSV validation errors without saving an invalid key', async () => {
    const onSaved = vi.fn();
    render(<AnswerKeyEditor template={template} onSaved={onSaved} />);

    const invalidCsvFile = new File(['question,answer\n3,A'], 'invalid.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByLabelText(/answer key csv/i), { target: { files: [invalidCsvFile] } });

    expect(await screen.findByText(/question 3 must be between 1 and 2/i)).toBeVisible();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('requires every answer before saving a key selected with the keyboard', async () => {
    const onSaved = vi.fn();
    render(<AnswerKeyEditor template={template} onSaved={onSaved} />);

    fireEvent.click(screen.getByRole('button', { name: 'Save answer key' }));
    expect(screen.getByText(/select one answer for every question/i)).toBeVisible();

    const firstAnswer = screen.getByRole('button', { name: 'A', pressed: false });
    firstAnswer.focus();
    fireEvent.keyDown(firstAnswer, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'B', pressed: false }));
    fireEvent.click(screen.getByRole('button', { name: 'Save answer key' }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ answers: { 1: 'A', 2: 'B' } }));
    });
  });
});
