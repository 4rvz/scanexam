import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from '../App';

it('renders the three primary teacher actions', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: /exam checker/i })).toBeVisible();
  expect(screen.getByRole('button', { name: /create worksheet/i })).toBeVisible();
  expect(screen.getByText(/select a worksheet, then open scan sheets/i)).toBeVisible();
});

it('opens the worksheet creation screen', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /create worksheet/i }));

  expect(screen.getByLabelText(/worksheet title/i)).toBeVisible();
});

it('clears a deleted selected worksheet before the answer-key screen can reopen it', async () => {
  render(<App />);
  const nav = within(screen.getByRole('navigation', { name: /main actions/i }));

  fireEvent.click(nav.getByRole('button', { name: /create worksheet/i }));
  fireEvent.change(screen.getByLabelText(/worksheet title/i), { target: { value: 'Delete me' } });
  fireEvent.click(screen.getByRole('button', { name: /save worksheet/i }));
  await screen.findByRole('heading', { name: /answer key: delete me/i });

  fireEvent.click(nav.getByRole('button', { name: /create worksheet/i }));
  const worksheet = await screen.findByRole('button', { name: 'Delete me' });
  fireEvent.click(worksheet);
  await screen.findByRole('heading', { name: /answer key: delete me/i });

  fireEvent.click(nav.getByRole('button', { name: /create worksheet/i }));
  fireEvent.click(await screen.findByRole('button', { name: /delete delete me/i }));
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Delete me' })).not.toBeInTheDocument());

  fireEvent.click(nav.getByRole('button', { name: /answer key/i }));
  expect(screen.getByRole('heading', { name: /choose a worksheet first/i })).toBeVisible();
  expect(screen.queryByRole('heading', { name: /answer key: delete me/i })).not.toBeInTheDocument();
});

it('opens the scanner for the selected worksheet', async () => {
  render(<App />);
  const nav = within(screen.getByRole('navigation', { name: /main actions/i }));

  fireEvent.click(nav.getByRole('button', { name: /create worksheet/i }));
  fireEvent.change(screen.getByLabelText(/worksheet title/i), { target: { value: 'Scan me' } });
  fireEvent.click(screen.getByRole('button', { name: /save worksheet/i }));
  await screen.findByRole('heading', { name: /answer key: scan me/i });

  fireEvent.click(nav.getByRole('button', { name: /scan sheets/i }));

  expect(screen.getByRole('heading', { name: /scan sheets: scan me/i })).toBeVisible();
  expect(screen.getByLabelText(/answer sheet camera preview/i)).toBeVisible();
});
