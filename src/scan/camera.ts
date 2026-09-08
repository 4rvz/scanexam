const rearCameraConstraints: MediaStreamConstraints = {
  video: { facingMode: { ideal: 'environment' } },
  audio: false,
};

export async function startCamera(video: HTMLVideoElement): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia(rearCameraConstraints);
  video.srcObject = stream;
  await video.play();
  return stream;
}

export function stopCamera(stream: MediaStream | null): void {
  stream?.getTracks().forEach(track => track.stop());
}

export function captureFrame(video: HTMLVideoElement): ImageData {
  const canvas = new OffscreenCanvas(video.videoWidth, video.videoHeight);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Cannot read the camera frame.');

  context.drawImage(video, 0, 0);
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

export function cameraErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    return 'Allow camera access in your browser settings, then try again.';
  }

  return 'Unable to open the camera. Check that it is available, then try again.';
}
