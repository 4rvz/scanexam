import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CameraScanner } from '../components/CameraScanner';
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

describe('CameraScanner', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('explains how to recover after camera permission is denied', async () => {
    const onError = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError')) },
    });

    render(<CameraScanner template={template} onScanned={vi.fn()} onError={onError} />);
    fireEvent.click(screen.getByRole('button', { name: /open camera/i }));

    expect(await screen.findByText(/allow camera access/i)).toBeVisible();
    expect(screen.getByRole('button', { name: /try again/i })).toBeVisible();
    expect(onError).toHaveBeenCalledWith(expect.stringMatching(/allow camera access/i));
  });

  it('stops the active stream when the scanner unmounts', async () => {
    const stop = vi.fn();
    const stream = { getTracks: () => [{ stop }] } as unknown as MediaStream;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    });
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();

    const view = render(<CameraScanner template={template} onScanned={vi.fn()} onError={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /open camera/i }));
    await screen.findByText(/camera ready/i);
    view.unmount();

    expect(stop).toHaveBeenCalledOnce();
  });

  it('confirms that a captured sheet will be checked', async () => {
    const stream = { getTracks: () => [] } as unknown as MediaStream;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    });
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    const context = { drawImage: vi.fn(), getImageData: vi.fn().mockReturnValue({} as ImageData) };
    vi.stubGlobal('OffscreenCanvas', vi.fn().mockImplementation(() => ({
      width: 1,
      height: 1,
      getContext: vi.fn().mockReturnValue(context),
    })));

    render(<CameraScanner template={template} onScanned={vi.fn()} onError={vi.fn()} />);
    const video = screen.getByLabelText(/answer sheet camera preview/i);
    Object.defineProperties(video, { videoWidth: { value: 1 }, videoHeight: { value: 1 } });
    fireEvent.click(screen.getByRole('button', { name: /open camera/i }));
    await screen.findByText(/camera ready/i);
    fireEvent.click(screen.getByRole('button', { name: /capture sheet/i }));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/sheet captured/i));
  });
});
