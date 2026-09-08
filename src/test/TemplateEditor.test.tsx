import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TemplateEditor } from '../components/TemplateEditor';

describe('TemplateEditor', () => {
  it('saves a worksheet with the selected answer choice count', async () => {
    const onSaved = vi.fn();
    render(<TemplateEditor onSaved={onSaved} />);

    fireEvent.change(screen.getByLabelText(/worksheet title/i), { target: { value: 'Unit 1' } });
    fireEvent.change(screen.getByLabelText(/answer choices/i), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /save worksheet/i }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ title: 'Unit 1', optionCount: 5 }));
    });
  });
});
