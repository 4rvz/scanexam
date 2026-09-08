import 'fake-indexeddb/auto';
import { fireEvent, render, screen } from '@testing-library/react';
import App from '../App';

it('renders the three primary teacher actions', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: /exam checker/i })).toBeVisible();
  expect(screen.getByRole('button', { name: /create worksheet/i })).toBeVisible();
});

it('opens the worksheet creation screen', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /create worksheet/i }));

  expect(screen.getByLabelText(/worksheet title/i)).toBeVisible();
});
