# Task 6 report: browser camera lifecycle and capture feedback

## Delivered behavior

- `startCamera` requests a video-only stream with an ideal rear-camera preference, attaches it to the preview, and starts playback.
- `stopCamera` releases every stream track and `captureFrame` returns the current video frame as `ImageData`.
- `CameraScanner` presents a labelled preview and framing guidance, maps denied permission to an actionable message, offers a retry control, confirms a capture, and stops its active stream during unmount.
- `App` opens the scanner for the currently selected worksheet. When no worksheet is selected, it asks the teacher to choose one first.
- The `ScanOutcome` callback type is present for Task 8, which will connect captured frames to the scanning pipeline.

## TDD evidence

### RED: camera helpers

`npm run test -- src/test/camera.test.ts` failed before the helper existed because Vitest could not resolve `../scan/camera`.

### GREEN: camera helpers

The same test command then passed all three assertions: rear-camera constraints and video attachment, stopping all tracks, and still-frame capture.

### RED: camera scanner

`npm run test -- src/test/CameraScanner.test.tsx` failed before the component existed because Vitest could not resolve `../components/CameraScanner`.

### GREEN: scanner and navigation

`npm run test -- src/test/camera.test.ts src/test/CameraScanner.test.tsx src/test/App.test.tsx` passed 10 tests across the helper, scanner, and selected-template navigation. It includes denied-permission recovery, cleanup on unmount, and capture feedback.

## Final verification

`git diff --check`, `npm run test`, and `npm run build` completed successfully. The full suite contains 38 passing tests across 11 files. The production build completed with Vite's existing large-chunk advisory and no build errors.

## Fix round 1: release stream after preview playback failure

### Root cause

`startCamera` acquired a stream before awaiting `video.play()`. If playback rejected, the function threw before returning the stream to `CameraScanner`, leaving no owner able to stop its tracks or clear the preview source.

### RED

Added a regression test that makes `video.play()` reject after `getUserMedia` resolves. Before the fix, `npm run test -- src/test/camera.test.ts` failed because the acquired track's `stop` method was never called.

### Fix and verification

`startCamera` now wraps preview attachment and playback in `try`/`catch`, clears `video.srcObject`, stops every acquired track, and rethrows the original playback error.

Focused verification passed 11 tests across `camera`, `CameraScanner`, and `App`. Final verification passed `git diff --check`, `npm run test` with 39 tests across 11 files, and `npm run build`. The build retains only Vite's large-chunk advisory.
