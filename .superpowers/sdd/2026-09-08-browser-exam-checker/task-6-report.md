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
