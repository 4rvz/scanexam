import { afterEach, describe, expect, it, vi } from 'vitest';
import { captureFrame, startCamera, stopCamera } from '../scan/camera';

describe('startCamera', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('requests the rear camera and attaches its stream to the preview', async () => {
    const stream = { getTracks: () => [] } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
    const video = document.createElement('video');
    const play = vi.spyOn(video, 'play').mockResolvedValue();

    await expect(startCamera(video)).resolves.toBe(stream);

    expect(getUserMedia).toHaveBeenCalledWith({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    });
    expect(video.srcObject).toBe(stream);
    expect(play).toHaveBeenCalledOnce();
  });

  it('stops every camera track when the stream is released', () => {
    const firstTrack = { stop: vi.fn() } as unknown as MediaStreamTrack;
    const secondTrack = { stop: vi.fn() } as unknown as MediaStreamTrack;
    const stream = { getTracks: () => [firstTrack, secondTrack] } as unknown as MediaStream;

    stopCamera(stream);

    expect(firstTrack.stop).toHaveBeenCalledOnce();
    expect(secondTrack.stop).toHaveBeenCalledOnce();
  });

  it('captures the visible camera frame as image data', () => {
    const image = { width: 2, height: 3, data: new Uint8ClampedArray(24) } as ImageData;
    const context = {
      drawImage: vi.fn(),
      getImageData: vi.fn().mockReturnValue(image),
    };
    const OffscreenCanvas = vi.fn().mockImplementation(function (width: number, height: number) {
      return { width, height, getContext: vi.fn().mockReturnValue(context) };
    });
    vi.stubGlobal('OffscreenCanvas', OffscreenCanvas);
    const video = document.createElement('video');
    Object.defineProperties(video, { videoWidth: { value: 2 }, videoHeight: { value: 3 } });

    expect(captureFrame(video)).toBe(image);
    expect(context.drawImage).toHaveBeenCalledWith(video, 0, 0);
  });
});
