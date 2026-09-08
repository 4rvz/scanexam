import { useEffect, useRef, useState } from 'react';
import type { GradeResult } from '../domain/scoring';
import type { WorksheetTemplate } from '../domain/template';
import { cameraErrorMessage, captureFrame, startCamera, stopCamera } from '../scan/camera';

export type ScanOutcome =
  | { ok: true; grade: GradeResult }
  | { ok: false; message: string };

interface CameraScannerProps {
  template: WorksheetTemplate;
  onScanned(result: ScanOutcome): void;
  onError(message: string): void;
}

export function CameraScanner({ template, onScanned: _onScanned, onError }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);
  const [isOpening, setIsOpening] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState(`Open the camera to scan ${template.title}.`);
  const [canRetry, setCanRetry] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopCamera(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  async function openCamera() {
    const video = videoRef.current;
    if (!video) return;

    setIsOpening(true);
    setCanRetry(false);
    setStatusMessage('Opening camera…');

    try {
      const stream = await startCamera(video);
      if (!mountedRef.current) {
        stopCamera(stream);
        return;
      }

      stopCamera(streamRef.current);
      streamRef.current = stream;
      setIsReady(true);
      setStatusMessage('Camera ready. Keep the entire answer sheet inside the guide.');
    } catch (error) {
      if (!mountedRef.current) return;

      const message = cameraErrorMessage(error);
      setIsReady(false);
      setCanRetry(true);
      setStatusMessage(message);
      onError(message);
    } finally {
      if (mountedRef.current) setIsOpening(false);
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video) return;

    try {
      captureFrame(video);
      setStatusMessage('Sheet captured. Page detection will begin next.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Cannot capture the camera frame.';
      setStatusMessage(message);
      onError(message);
    }
  }

  return (
    <section aria-labelledby="scan-sheets-heading">
      <h2 id="scan-sheets-heading">Scan sheets: {template.title}</h2>
      <p>Hold the answer sheet flat and keep all four corners visible in the camera preview.</p>
      <video ref={videoRef} aria-label="Answer sheet camera preview" playsInline muted />
      <p role="status" aria-live="polite">{statusMessage}</p>
      {!isReady && !canRetry && (
        <button type="button" onClick={() => void openCamera()} disabled={isOpening}>
          Open camera
        </button>
      )}
      {canRetry && (
        <button type="button" onClick={() => void openCamera()} disabled={isOpening}>
          Try again
        </button>
      )}
      {isReady && <button type="button" onClick={capture}>Capture sheet</button>}
    </section>
  );
}
