# Browser Exam Checker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, no-account web app that generates printable A–D/A–E answer sheets and grades anonymous sheets from a phone camera in the browser.

**Architecture:** A React/TypeScript single-page application keeps templates in IndexedDB and creates PDFs from a shared form-layout map. The camera pipeline detects four form markers, rectifies the captured page with OpenCV.js, measures the known bubble regions, and sends classified answers to a pure grading module. All processing stays in the browser.

**Tech Stack:** Vite, React, TypeScript, Vitest, React Testing Library, Playwright, jsPDF, `qrcode`, `@zxing/browser`, OpenCV.js loaded as a local static asset, IndexedDB via `idb`.

**Spec:** `docs/superpowers/specs/2026-09-08-browser-exam-checker-design.md`

## Global Constraints

- Ship as a static client-side application: no API, database, authentication, image upload endpoint, or server-side data storage.
- Support exactly A–D and A–E option sets in the first release.
- Persist templates in IndexedDB; keep camera frames and scan results in memory only.
- The printable form has fixed coordinates, four corner markers, a worksheet code, numbered answer bubbles, and 50 items per page.
- Treat blank and unclear answers as uncredited, display them separately, and never silently guess an ambiguous mark.
- CSV uses `question,answer`, allows an optional header, and rejects the entire import on any invalid row.
- Print instructions must say actual size / 100%, no fit-to-page scaling, and dark fully filled marks.
- Verify on Android Chrome and iPhone Safari before release; physical print-and-scan testing is a release gate.

---

## File Structure

```text
package.json                         Tooling and runtime dependencies
vite.config.ts                       Vite configuration
tsconfig.json                        Strict TypeScript configuration
playwright.config.ts                 Browser test configuration
src/main.tsx                         React bootstrap
src/App.tsx                          Screen routing and active-template state
src/styles.css                       Responsive, accessible application styling
src/domain/template.ts               Template types and validation
src/domain/scoring.ts                Pure answer comparison and result types
src/domain/csv.ts                    CSV parsing and validation
src/domain/layout.ts                 Shared page, marker, bubble, and QR-code geometry
src/storage/templateStore.ts         IndexedDB CRUD and backup serialization
src/pdf/answerSheetPdf.ts            PDF document generation from layout geometry
src/scan/camera.ts                   Camera lifecycle and rear-camera selection
src/scan/formDetector.ts             Marker detection and perspective rectification
src/scan/bubbleReader.ts             Pixel measurements and answer classification
src/scan/scanWorksheet.ts            Scan-pipeline orchestration
src/components/TemplateEditor.tsx    Worksheet configuration and template save
src/components/AnswerKeyEditor.tsx   Manual key entry and CSV import
src/components/PdfDownload.tsx       Printable-form download and print guidance
src/components/CameraScanner.tsx     Camera preview, capture, and scan feedback
src/components/ScanResults.tsx       Score and per-item outcome presentation
src/components/TemplateBackup.tsx    JSON backup export/import controls
src/test/*.test.ts(x)                Unit and component tests
e2e/*.spec.ts                        Browser workflows and accessibility checks
public/opencv.js                     Pinned local OpenCV.js distribution
public/fixtures/*.png                Synthetic and photographed scan fixtures
README.md                            Local run, printing, privacy, and test guidance
```

## Task 1: Bootstrap the static application and test harness

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles.css`, `playwright.config.ts`, `README.md`
- Create: `src/test/setup.ts`, `src/test/App.test.tsx`, `e2e/app-shell.spec.ts`

**Interfaces:**
- Produces `App`, the top-level component rendered by `src/main.tsx`.
- Produces the `npm run test`, `npm run test:e2e`, `npm run build`, and `npm run dev` commands used by every later task.

- [ ] **Step 1: Create the Vite React TypeScript project metadata and scripts**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 2: Write the failing application-shell test**

```tsx
import { render, screen } from '@testing-library/react';
import App from '../App';

it('renders the three primary teacher actions', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /exam checker/i })).toBeVisible();
  expect(screen.getByRole('button', { name: /create worksheet/i })).toBeVisible();
});
```

- [ ] **Step 3: Run the shell test and verify it fails because `App` does not exist**

Run: `npm run test -- src/test/App.test.tsx`

Expected: FAIL with a module-resolution error for `../App`.

- [ ] **Step 4: Implement the minimal accessible application shell**

```tsx
export default function App() {
  return (
    <main>
      <h1>Exam Checker</h1>
      <nav aria-label="Main actions">
        <button type="button">Create worksheet</button>
        <button type="button">Answer key</button>
        <button type="button">Scan sheets</button>
      </nav>
    </main>
  );
}
```

- [ ] **Step 5: Add a Playwright shell check**

```ts
test('opens the teacher workspace', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Exam Checker' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Scan sheets' })).toBeVisible();
});
```

- [ ] **Step 6: Run unit tests, browser test, and production build**

Run: `npm run test && npm run test:e2e && npm run build`

Expected: all commands exit 0.

- [ ] **Step 7: Commit the bootstrap**

```bash
git add package.json vite.config.ts tsconfig.json index.html src playwright.config.ts e2e README.md
git commit -m "chore: bootstrap exam checker web app"
```

## Task 2: Define worksheet, answer, and grading domain rules

**Files:**
- Create: `src/domain/template.ts`, `src/domain/scoring.ts`
- Test: `src/test/template.test.ts`, `src/test/scoring.test.ts`

**Interfaces:**
- Produces `OptionCount`, `AnswerOption`, `WorksheetTemplate`, `validateTemplateInput`, and `createTemplate`.
- Produces `DetectedAnswer`, `ItemResult`, `GradeResult`, and `gradeAnswers` for scan and UI components.

- [ ] **Step 1: Write failing validation tests**

```ts
expect(validateTemplateInput({ title: 'Math quiz', itemCount: 20, optionCount: 4 })).toEqual([]);
expect(validateTemplateInput({ title: '', itemCount: 0, optionCount: 6 })).toEqual([
  'Enter a worksheet title.',
  'Choose between 1 and 200 items.',
  'Choose 4 or 5 answer options.'
]);
```

- [ ] **Step 2: Run the template test and verify it fails**

Run: `npm run test -- src/test/template.test.ts`

Expected: FAIL because `validateTemplateInput` is not exported.

- [ ] **Step 3: Implement the template types and validator**

```ts
export type OptionCount = 4 | 5;
export type AnswerOption = 'A' | 'B' | 'C' | 'D' | 'E';

export interface WorksheetTemplate {
  id: string;
  title: string;
  itemCount: number;
  optionCount: OptionCount;
  answers: Record<number, AnswerOption>;
  layoutVersion: 1;
  createdAt: string;
  updatedAt: string;
}

export function validateTemplateInput(input: {
  title: string; itemCount: number; optionCount: number;
}): string[] {
  const errors: string[] = [];
  if (!input.title.trim()) errors.push('Enter a worksheet title.');
  if (!Number.isInteger(input.itemCount) || input.itemCount < 1 || input.itemCount > 200) errors.push('Choose between 1 and 200 items.');
  if (input.optionCount !== 4 && input.optionCount !== 5) errors.push('Choose 4 or 5 answer options.');
  return errors;
}

export function createTemplate(input: { title: string; itemCount: number; optionCount: OptionCount }): WorksheetTemplate {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), ...input, answers: {}, layoutVersion: 1, createdAt: now, updatedAt: now };
}
```

- [ ] **Step 4: Write the failing grading test**

```ts
const result = gradeAnswers({ 1: 'A', 2: 'B', 3: 'C' }, {
  1: { kind: 'selected', answer: 'A' },
  2: { kind: 'blank' },
  3: { kind: 'unclear', candidates: ['C', 'D'] },
});
expect(result).toMatchObject({ correct: 1, total: 3, incorrect: 0, blank: 1, unclear: 1 });
```

- [ ] **Step 5: Implement pure grading with explicit states**

```ts
export type DetectedAnswer =
  | { kind: 'selected'; answer: AnswerOption }
  | { kind: 'blank' }
  | { kind: 'unclear'; candidates: AnswerOption[] };

export function gradeAnswers(
  key: Record<number, AnswerOption>,
  detected: Record<number, DetectedAnswer>,
): GradeResult {
  const items = Object.entries(key).map(([number, correctAnswer]) => {
    const detectedAnswer = detected[Number(number)] ?? { kind: 'blank' as const };
    return { number: Number(number), correctAnswer, detectedAnswer, isCorrect: detectedAnswer.kind === 'selected' && detectedAnswer.answer === correctAnswer };
  });
  return summarizeItems(items);
}
```

- [ ] **Step 6: Run domain tests**

Run: `npm run test -- src/test/template.test.ts src/test/scoring.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit domain rules**

```bash
git add src/domain src/test/template.test.ts src/test/scoring.test.ts
git commit -m "feat: add worksheet validation and grading rules"
```

## Task 3: Add answer-key CSV parsing and IndexedDB template persistence

**Files:**
- Create: `src/domain/csv.ts`, `src/storage/templateStore.ts`
- Test: `src/test/csv.test.ts`, `src/test/templateStore.test.ts`

**Interfaces:**
- Consumes `WorksheetTemplate` and `AnswerOption` from `src/domain/template.ts`.
- Produces `parseAnswerKeyCsv(csv, itemCount, optionCount): CsvImportResult`.
- Produces `templateStore.list()`, `.get(id)`, `.put(template)`, `.remove(id)`, `.export(template)`, and `.import(json)`.

- [ ] **Step 1: Write failing CSV import tests for valid and invalid files**

```ts
expect(parseAnswerKeyCsv('question,answer\n1,b\n2,D', 2, 4)).toEqual({
  ok: true, answers: { 1: 'B', 2: 'D' },
});
expect(parseAnswerKeyCsv('1,A\n1,B\n3,E', 2, 4)).toEqual({
  ok: false,
  errors: ['Row 2: question 1 is duplicated.', 'Row 3: question 3 must be between 1 and 2.', 'Questions 2 are missing.'],
});
```

- [ ] **Step 2: Run the CSV tests and verify they fail**

Run: `npm run test -- src/test/csv.test.ts`

Expected: FAIL because `parseAnswerKeyCsv` does not exist.

- [ ] **Step 3: Implement all-or-nothing CSV parsing**

```ts
export type CsvImportResult =
  | { ok: true; answers: Record<number, AnswerOption> }
  | { ok: false; errors: string[] };

export function parseAnswerKeyCsv(
  csv: string, itemCount: number, optionCount: OptionCount,
): CsvImportResult {
  const rows = csv.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const dataRows = rows[0]?.toLowerCase() === 'question,answer' ? rows.slice(1) : rows;
  return validateCsvRows(dataRows, itemCount, optionCount);
}
```

- [ ] **Step 4: Write a failing IndexedDB round-trip test**

```ts
await templateStore.put(template);
await expect(templateStore.get(template.id)).resolves.toEqual(template);
await expect(templateStore.list()).resolves.toHaveLength(1);
```

- [ ] **Step 5: Implement the IndexedDB store and JSON backup validation**

```ts
const dbPromise = openDB<ScanexamDb>('scanexam', 1, {
  upgrade(db) { db.createObjectStore('templates', { keyPath: 'id' }); },
});
export async function listTemplates(): Promise<WorksheetTemplate[]> { return (await dbPromise).getAll('templates'); }
export async function getTemplate(id: string): Promise<WorksheetTemplate | undefined> { return (await dbPromise).get('templates', id); }
export async function putTemplate(template: WorksheetTemplate): Promise<void> { await (await dbPromise).put('templates', template); }
export async function removeTemplate(id: string): Promise<void> { await (await dbPromise).delete('templates', id); }
export function exportTemplate(template: WorksheetTemplate): string { return JSON.stringify(template); }
export function importTemplate(json: string): WorksheetTemplate { return validateImportedTemplate(JSON.parse(json)); }
```

- [ ] **Step 6: Replace the temporary stub bodies with `idb` calls and validation, then run storage and CSV tests**

Run: `npm run test -- src/test/csv.test.ts src/test/templateStore.test.ts`

Expected: PASS; invalid imports leave existing records unchanged.

- [ ] **Step 7: Commit import and persistence**

```bash
git add src/domain/csv.ts src/storage src/test/csv.test.ts src/test/templateStore.test.ts package.json
git commit -m "feat: store templates and import answer keys"
```

## Task 4: Create one shared printable-form geometry and PDF generator

**Files:**
- Create: `src/domain/layout.ts`, `src/pdf/answerSheetPdf.ts`
- Test: `src/test/layout.test.ts`, `src/test/answerSheetPdf.test.ts`

**Interfaces:**
- Consumes `WorksheetTemplate`.
- Produces `PAGE_WIDTH`, `PAGE_HEIGHT`, `ITEMS_PER_PAGE`, `getPageLayout(template, pageIndex)`, and `createAnswerSheetPdf(template): Blob`.
- Later scan tasks consume `getPageLayout`; PDF and scanner must never define separate bubble coordinates.

- [ ] **Step 1: Write failing geometry tests**

```ts
const layout = getPageLayout(templateWith({ itemCount: 51, optionCount: 5 }), 1);
expect(layout.questions).toHaveLength(1);
expect(layout.questions[0]).toMatchObject({ number: 51, bubbles: { A: expect.any(Object), E: expect.any(Object) } });
expect(layout.markers).toHaveLength(4);
```

- [ ] **Step 2: Run the geometry test and verify it fails**

Run: `npm run test -- src/test/layout.test.ts`

Expected: FAIL because `getPageLayout` is not exported.

- [ ] **Step 3: Implement fixed page geometry**

```ts
export const PAGE_WIDTH = 210;
export const PAGE_HEIGHT = 297;
export const ITEMS_PER_PAGE = 50;
export function getPageLayout(template: WorksheetTemplate, pageIndex: number): PageLayout {
  const firstQuestion = pageIndex * ITEMS_PER_PAGE + 1;
  const questionNumbers = Array.from({ length: Math.min(ITEMS_PER_PAGE, template.itemCount - firstQuestion + 1) }, (_, index) => firstQuestion + index);
  return buildPageLayout(template, pageIndex, questionNumbers);
}
```

- [ ] **Step 4: Write a failing PDF-content test**

```ts
const pdf = await createAnswerSheetPdf(templateWith({ title: 'Science', itemCount: 51, optionCount: 4 }));
expect(pdf.type).toBe('application/pdf');
expect(pdf.size).toBeGreaterThan(1_000);
```

- [ ] **Step 5: Implement PDF generation from `getPageLayout` and encode a QR payload of `{ templateId, layoutVersion, pageIndex }` on every page**

```ts
export async function createAnswerSheetPdf(template: WorksheetTemplate): Promise<Blob> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  getAllPageLayouts(template).forEach((layout, pageIndex) => drawPage(pdf, template, layout, pageIndex));
  return pdf.output('blob');
}
```

- [ ] **Step 6: Run layout and PDF tests, then inspect a generated 51-item PDF manually**

Run: `npm run test -- src/test/layout.test.ts src/test/answerSheetPdf.test.ts && npm run dev`

Expected: tests PASS; page 1 has items 1–50 and page 2 has item 51 with four markers.

- [ ] **Step 7: Commit printable forms**

```bash
git add src/domain/layout.ts src/pdf src/test/layout.test.ts src/test/answerSheetPdf.test.ts package.json
git commit -m "feat: generate scannable answer sheet PDFs"
```

## Task 5: Build worksheet and answer-key teacher screens

**Files:**
- Create: `src/components/TemplateEditor.tsx`, `src/components/AnswerKeyEditor.tsx`, `src/components/PdfDownload.tsx`, `src/components/TemplateBackup.tsx`
- Modify: `src/App.tsx`, `src/styles.css`
- Test: `src/test/TemplateEditor.test.tsx`, `src/test/AnswerKeyEditor.test.tsx`

**Interfaces:**
- Consumes `createTemplate`, `validateTemplateInput`, `parseAnswerKeyCsv`, `templateStore`, and `createAnswerSheetPdf`.
- Produces persisted, complete `WorksheetTemplate` records selectable by the scan screen.

- [ ] **Step 1: Write a failing template-editor interaction test**

```tsx
render(<TemplateEditor onSaved={onSaved} />);
await user.type(screen.getByLabelText(/worksheet title/i), 'Unit 1');
await user.selectOptions(screen.getByLabelText(/answer choices/i), '5');
await user.click(screen.getByRole('button', { name: /save worksheet/i }));
expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ optionCount: 5 }));
```

- [ ] **Step 2: Run the component test and verify it fails**

Run: `npm run test -- src/test/TemplateEditor.test.tsx`

Expected: FAIL because `TemplateEditor` does not exist.

- [ ] **Step 3: Implement create, list, choose, and delete-template UI controls**

```tsx
export function TemplateEditor({ onSaved }: { onSaved(template: WorksheetTemplate): void }) {
  const [title, setTitle] = useState('');
  const [itemCount, setItemCount] = useState(20);
  const [optionCount, setOptionCount] = useState<OptionCount>(4);
  const save = async () => { const template = createTemplate({ title, itemCount, optionCount }); await putTemplate(template); onSaved(template); };
  return <form onSubmit={event => { event.preventDefault(); void save(); }}>
    <label>Worksheet title<input aria-label="Worksheet title" value={title} onChange={event => setTitle(event.target.value)} /></label>
    <label>Item count<input aria-label="Item count" type="number" value={itemCount} onChange={event => setItemCount(Number(event.target.value))} /></label>
    <label>Answer choices<select aria-label="Answer choices" value={optionCount} onChange={event => setOptionCount(Number(event.target.value) as OptionCount)}><option value={4}>A–D</option><option value={5}>A–E</option></select></label>
    <button type="submit">Save worksheet</button>
  </form>;
}
```

- [ ] **Step 4: Write a failing CSV error-display test**

```tsx
render(<AnswerKeyEditor template={template} onSaved={onSaved} />);
await user.upload(screen.getByLabelText(/answer key csv/i), invalidCsvFile);
expect(await screen.findByText(/question 3 must be between 1 and 2/i)).toBeVisible();
expect(onSaved).not.toHaveBeenCalled();
```

- [ ] **Step 5: Implement manual answer buttons, CSV import, PDF download, and JSON backup controls**

```tsx
<fieldset aria-label={`Question ${question}`}>
  {options.map(option => <button aria-pressed={answers[question] === option}>{option}</button>)}
</fieldset>
```

- [ ] **Step 6: Run teacher-screen tests and verify keyboard operation**

Run: `npm run test -- src/test/TemplateEditor.test.tsx src/test/AnswerKeyEditor.test.tsx`

Expected: PASS; a key cannot be saved until every question has one selected answer.

- [ ] **Step 7: Commit teacher workflow**

```bash
git add src/components src/App.tsx src/styles.css src/test/TemplateEditor.test.tsx src/test/AnswerKeyEditor.test.tsx
git commit -m "feat: add worksheet and answer key workflow"
```

## Task 6: Add camera lifecycle and capture feedback

**Files:**
- Create: `src/scan/camera.ts`, `src/components/CameraScanner.tsx`
- Test: `src/test/camera.test.ts`, `src/test/CameraScanner.test.tsx`

**Interfaces:**
- Produces `startCamera(video): Promise<MediaStream>`, `stopCamera(stream)`, and `captureFrame(video): ImageData`.
- `CameraScanner` accepts `template: WorksheetTemplate`, `onScanned(result: ScanOutcome)`, and `onError(message: string)`.
- Task 8 supplies `scanWorksheet` to the component.

- [ ] **Step 1: Write a failing rear-camera constraint test**

```ts
await startCamera(video);
expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
  video: { facingMode: { ideal: 'environment' } }, audio: false,
});
```

- [ ] **Step 2: Run the camera helper test and verify it fails**

Run: `npm run test -- src/test/camera.test.ts`

Expected: FAIL because `startCamera` is not exported.

- [ ] **Step 3: Implement stream start, stop, still-frame capture, and permission error mapping**

```ts
export async function startCamera(video: HTMLVideoElement): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
  video.srcObject = stream;
  await video.play();
  return stream;
}
export function stopCamera(stream: MediaStream | null): void { stream?.getTracks().forEach(track => track.stop()); }
export function captureFrame(video: HTMLVideoElement): ImageData {
  const canvas = new OffscreenCanvas(video.videoWidth, video.videoHeight);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Cannot read the camera frame.');
  context.drawImage(video, 0, 0);
  return context.getImageData(0, 0, canvas.width, canvas.height);
}
```

- [ ] **Step 4: Write a failing scanner-component test for denied permission**

```tsx
render(<CameraScanner template={template} onScanned={vi.fn()} onError={vi.fn()} />);
await user.click(screen.getByRole('button', { name: /open camera/i }));
expect(await screen.findByText(/allow camera access/i)).toBeVisible();
```

- [ ] **Step 5: Implement camera UI with labelled guide, detected-page status, retry, and cleanup**

```tsx
<video aria-label="Answer sheet camera preview" playsInline muted />
<p role="status">{statusMessage}</p>
<button type="button" onClick={capture}>Capture sheet</button>
```

- [ ] **Step 6: Run camera tests**

Run: `npm run test -- src/test/camera.test.ts src/test/CameraScanner.test.tsx`

Expected: PASS; camera tracks stop when the component unmounts.

- [ ] **Step 7: Commit camera capture**

```bash
git add src/scan/camera.ts src/components/CameraScanner.tsx src/test/camera.test.ts src/test/CameraScanner.test.tsx
git commit -m "feat: add browser camera capture"
```

## Task 7: Implement form detection and page rectification with fixtures

**Files:**
- Create: `src/scan/formDetector.ts`, `public/opencv.js`, `public/fixtures/flat-sheet.png`, `public/fixtures/cropped-sheet.png`, `public/fixtures/skewed-sheet.png`, `public/fixtures/dim-sheet.png`
- Test: `src/test/formDetector.test.ts`

**Interfaces:**
- Consumes an `ImageData` and `WorksheetTemplate` from `src/domain/template.ts`.
- Produces `detectAndRectify(image, template): Promise<DetectionResult>`.
- `DetectionResult` is `{ ok: true; rectified: ImageData; pageIndex: number } | { ok: false; reason: 'markers' | 'blur' | 'brightness' | 'code' }`.

- [ ] **Step 1: Add fixed photographed and synthetic fixtures with known expected outcomes**

```ts
const cases = [
  ['flat-sheet.png', true], ['skewed-sheet.png', true],
  ['cropped-sheet.png', false], ['dim-sheet.png', false],
] as const;
const wrongTemplate = await detectAndRectify(loadFixture('flat-sheet.png'), otherTemplate);
expect(wrongTemplate).toEqual({ ok: false, reason: 'code' });
```

- [ ] **Step 2: Write a failing marker-detection test**

```ts
const result = await detectAndRectify(loadFixture('skewed-sheet.png'), template);
expect(result.ok).toBe(true);
if (result.ok) expect(result.rectified.width).toBeGreaterThan(1000);
```

- [ ] **Step 3: Run the form-detector test and verify it fails**

Run: `npm run test -- src/test/formDetector.test.ts`

Expected: FAIL because `detectAndRectify` does not exist.

- [ ] **Step 4: Load the pinned local OpenCV asset, detect four square markers, rectify to A4, and decode the QR payload with `@zxing/browser`**

```ts
export async function detectAndRectify(image: ImageData, template: WorksheetTemplate): Promise<DetectionResult> {
  const mat = cv.matFromImageData(image);
  const corners = findOrderedMarkerCorners(mat);
  if (!corners) return { ok: false, reason: 'markers' };
  if (meanLuminance(mat) < 45) return { ok: false, reason: 'brightness' };
  if (laplacianVariance(mat) < 70) return { ok: false, reason: 'blur' };
  const rectified = warpToA4Page(mat, corners);
  const code = await decodeQrPayload(rectified);
  if (!code || code.templateId !== template.id || code.layoutVersion !== template.layoutVersion) return { ok: false, reason: 'code' };
  return { ok: true, rectified, pageIndex: code.pageIndex };
}
```

- [ ] **Step 5: Add brightness and blur guards before perspective warp**

```ts
if (meanLuminance < 45) return { ok: false, reason: 'brightness' };
if (laplacianVariance < 70) return { ok: false, reason: 'blur' };
```

- [ ] **Step 6: Run fixture tests and inspect rectified fixture outputs in a browser debug view**

Run: `npm run test -- src/test/formDetector.test.ts`

Expected: flat and skewed sheets pass; cropped and dim sheets return their documented reason.

- [ ] **Step 7: Commit form detection**

```bash
git add src/scan/formDetector.ts public/opencv.js public/fixtures src/test/formDetector.test.ts
git commit -m "feat: detect and straighten answer sheets"
```

## Task 8: Read bubbles, grade a scanned page, and present results

**Files:**
- Create: `src/scan/bubbleReader.ts`, `src/scan/scanWorksheet.ts`, `src/components/ScanResults.tsx`
- Modify: `src/components/CameraScanner.tsx`, `src/App.tsx`
- Test: `src/test/bubbleReader.test.ts`, `src/test/scanWorksheet.test.ts`, `src/test/ScanResults.test.tsx`

**Interfaces:**
- Consumes `rectified: ImageData`, `PageLayout`, `WorksheetTemplate`, and `gradeAnswers`.
- Produces `readBubbles(image, layout): Record<number, DetectedAnswer>` and `scanWorksheet(frame, template): Promise<ScanOutcome>`.
- `ScanOutcome` is `{ ok: true; grade: GradeResult } | { ok: false; message: string }`.

- [ ] **Step 1: Write failing bubble-classification tests**

```ts
expect(readBubbles(markedAImage, layout)[1]).toEqual({ kind: 'selected', answer: 'A' });
expect(readBubbles(blankImage, layout)[1]).toEqual({ kind: 'blank' });
expect(readBubbles(doubleMarkedImage, layout)[1]).toEqual({ kind: 'unclear', candidates: ['B', 'D'] });
```

- [ ] **Step 2: Run the bubble-reader tests and verify they fail**

Run: `npm run test -- src/test/bubbleReader.test.ts`

Expected: FAIL because `readBubbles` is not exported.

- [ ] **Step 3: Implement normalized per-bubble ink measurements and classification**

```ts
export function readBubbles(image: ImageData, layout: PageLayout): Record<number, DetectedAnswer> {
  return Object.fromEntries(layout.questions.map(question => [question.number, classifyBubbleMeasurements(
    measureBubbleCoverage(image, question.bubbles), 0.42, 0.12,
  )]));
}
```

- [ ] **Step 4: Write a failing end-to-end scan orchestration test**

```ts
await expect(scanWorksheet(flatMarkedFrame, template)).resolves.toMatchObject({
  ok: true, grade: { correct: 18, total: 20, blank: 1, unclear: 1 },
});
```

- [ ] **Step 5: Implement scan orchestration and user-facing detector error messages**

```ts
export async function scanWorksheet(frame: ImageData, template: WorksheetTemplate): Promise<ScanOutcome> {
  const detection = await detectAndRectify(frame, template);
  if (!detection.ok) return { ok: false, message: detectionMessages[detection.reason] };
  const layout = getPageLayout(template, detection.pageIndex);
  return { ok: true, grade: gradeAnswers(template.answers, readBubbles(detection.rectified, layout)) };
}
```

- [ ] **Step 6: Implement results UI with score, percentage, per-item states, and Scan next sheet**

```tsx
<h2>{grade.correct} / {grade.total}</h2>
<p>{Math.round((grade.correct / grade.total) * 100)}%</p>
<button type="button" onClick={onScanNext}>Scan next sheet</button>
```

- [ ] **Step 7: Run scan, result, and full unit suites**

Run: `npm run test -- src/test/bubbleReader.test.ts src/test/scanWorksheet.test.ts src/test/ScanResults.test.tsx && npm run test`

Expected: PASS; blank and unclear items receive no credit and appear separately.

- [ ] **Step 8: Commit scanning and grading**

```bash
git add src/scan/bubbleReader.ts src/scan/scanWorksheet.ts src/components/ScanResults.tsx src/components/CameraScanner.tsx src/App.tsx src/test
git commit -m "feat: grade scanned answer sheets"
```

## Task 9: Complete privacy copy, responsive UX, deployment checks, and release validation

**Files:**
- Modify: `src/App.tsx`, `src/styles.css`, `README.md`
- Create: `e2e/teacher-flow.spec.ts`, `e2e/accessibility.spec.ts`, `docs/physical-scan-test-sheet.md`

**Interfaces:**
- Consumes the complete UI and keeps persistence limited to `templateStore`.
- Produces release evidence for build, browser flows, accessibility basics, printer output, and physical scans.

- [ ] **Step 1: Write a failing complete teacher-flow browser test**

```ts
test('creates a worksheet and reaches scan mode without an account', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /create worksheet/i }).click();
  await page.getByLabel(/worksheet title/i).fill('Practice test');
  await page.getByRole('button', { name: /save worksheet/i }).click();
  await page.getByRole('button', { name: /scan sheets/i }).click();
  await expect(page.getByText(/nothing leaves this device/i)).toBeVisible();
});
```

- [ ] **Step 2: Run the browser flow test and verify it fails until privacy copy is present**

Run: `npm run test:e2e -- e2e/teacher-flow.spec.ts`

Expected: FAIL because the stated privacy message is absent.

- [ ] **Step 3: Add responsive styles, focus states, textual status messages, and privacy/printing guidance**

```css
button:focus-visible, input:focus-visible, select:focus-visible {
  outline: 3px solid #155eef;
  outline-offset: 2px;
}
@media (max-width: 640px) { .action-grid { grid-template-columns: 1fr; } }
```

- [ ] **Step 4: Add accessibility and no-network-data browser checks**

```ts
await expect(page.getByRole('status')).toBeVisible();
await expect(page.getByText(/camera frames and scores are not saved/i)).toBeVisible();
```

- [ ] **Step 5: Run automated verification**

Run: `npm run test && npm run test:e2e && npm run build`

Expected: all commands exit 0.

- [ ] **Step 6: Execute and record the physical scan test sheet**

```markdown
Test each printed PDF at 100% on at least two printers and scan on Android Chrome and iPhone Safari:
- flat, skewed, dim, shadowed, glare, blurry, cropped, and wrong-template captures;
- fully filled, blank, double-marked, and faint bubbles;
- expected score and displayed recovery message for every case.
```

- [ ] **Step 7: Update README with deployment and teacher guidance**

```markdown
Deploy the generated `dist/` directory to any static host served over HTTPS. Camera access requires HTTPS in normal mobile browsers. Print the generated PDF at actual size (100%); do not use fit to page.
```

- [ ] **Step 8: Commit release readiness**

```bash
git add src/App.tsx src/styles.css README.md e2e docs/physical-scan-test-sheet.md
git commit -m "docs: add scan validation and deployment guidance"
```

## Final Verification

- [ ] Run `git status --short` and confirm only intended files are present.
- [ ] Run `npm run test`, `npm run test:e2e`, and `npm run build`; record their exact outcomes in the pull request or handoff.
- [ ] Verify a 4-option and a 5-option 51-question PDF visually: numbers, page indicators, all four corner markers, and print instruction text.
- [ ] Run the physical scan matrix in `docs/physical-scan-test-sheet.md` before publishing.
- [ ] Confirm browser developer tools show no requests carrying templates, answer keys, camera frames, or scan results.
