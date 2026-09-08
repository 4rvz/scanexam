import { render, screen } from '@testing-library/react';
import App from '../App';

it('renders the three primary teacher actions', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: /exam checker/i })).toBeVisible();
  expect(screen.getByRole('button', { name: /create worksheet/i })).toBeVisible();
});
