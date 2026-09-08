# Browser Exam Checker — Design Specification

## Purpose

Create a no-account web application that lets a teacher create a multiple-choice answer sheet, print it as a PDF, enter or import an answer key, and use a phone camera in the browser to grade each completed sheet immediately.

The first release grades anonymous sheets. It does not create student records or retain a history of scores.

## Product principles

- No sign-up, login, server-side data storage, or student data collection.
- All worksheet settings, keys, camera frames, and scan results stay on the teacher's device.
- The scanner must report uncertainty instead of guessing an answer.
- The printable form is a deliberately controlled layout rather than a general document scanner.

## Scope

### Included

- Worksheet configuration: title, question count, and four or five answer choices.
- Printable answer-sheet PDF generation.
- Manual answer-key entry.
- CSV answer-key import and validation.
- Browser-based phone-camera capture and optical mark recognition.
- Immediate score, percentage, item results, and unclear-answer reporting.
- Local persistence of templates in the same browser.
- Optional template backup and restore through a JSON file.

### Deferred

- Student identity, handwritten-name recognition, score history, class rosters, and reports.
- Question text, essay grading, short answers, and answer explanations.
- Multiple versions of one test, cloud sync, collaboration, accounts, or online sharing.
- Native mobile applications.

## Teacher workflow

1. The teacher opens **Create worksheet** and enters a title, item count, and option set: A–D or A–E.
2. The app creates a template identifier and lays out numbered bubble rows across as many PDF pages as needed. The first release targets 50 items per page and continues automatically onto later pages.
3. The teacher downloads and prints the PDF at actual size (100%), without fit-to-page scaling.
4. In **Answer key**, the teacher either selects one answer per question in the on-screen grid or imports a CSV file.
5. The teacher opens **Scan**, selects the matching template, grants camera access, and frames one completed answer-sheet page in the guide.
6. The app confirms it can find and straighten the page. The teacher captures the image.
7. The app reads each answer, flags ambiguity, calculates the score, and presents the result. **Scan next sheet** clears the transient result and returns to capture.

## Answer-key input

Manual entry is a numbered grid with A–D or A–E controls. A template cannot be marked ready to scan until every numbered item has exactly one answer.

CSV is the upload format because it is easy to create in Excel, Google Sheets, and text editors. It accepts an optional header and these columns:

```csv
question,answer
1,B
2,D
3,A
```

Rules:

- `question` is a whole number from 1 through the configured item count.
- `answer` is one allowed option, case-insensitive.
- Order does not matter.
- Blank lines are ignored.
- Duplicate questions, missing questions, extra questions, invalid choices, and malformed rows are shown in a clear correction list; no partial key is saved.

## Printable form

Each page contains:

- A worksheet title and page indicator.
- A QR code containing the non-personal template identifier, layout version, and page number, used to ensure the scan matches the active template and page.
- Four high-contrast corner markers used for detection and perspective correction.
- Numbered, evenly spaced answer bubbles for each valid option.
- A small printed instruction to use a dark pencil or pen, fill one bubble completely, and print at 100%.

The page layout uses fixed coordinates based on the PDF page dimensions. The scanner uses the same coordinate map after it straightens a camera image, so it does not need OCR or to infer arbitrary form layouts. A printable calibration mark is out of scope for the first release; it becomes a candidate only if physical field testing shows material printer-scaling errors.

## Browser architecture

The application is a client-side single-page web application and can be deployed as static files.

| Component | Responsibility |
| --- | --- |
| Template editor | Configure the worksheet and render manual key entry. |
| Key importer | Parse and validate CSV before it changes a template. |
| PDF generator | Create the controlled answer-sheet layout and its marker map. |
| Local template store | Save templates in IndexedDB; import/export JSON backups. |
| Camera capture | Request a rear camera where available, present framing guidance, and take still frames. |
| Form detector | Locate corner markers, decode the QR code, reject invalid frames or wrong templates, then produce a rectified page image and page number. |
| Bubble reader | Measure darkness inside each known bubble region and classify marked, blank, or ambiguous choices. |
| Grader | Compare reliable detected answers to the key and return score and item results. |
| Results view | Display total, percentage, correct/incorrect counts, unclear items, and rescan controls. |

The first deployment has no API, database, authentication system, or image upload endpoint. Any third-party computer-vision library must run locally in the browser and must not transmit frames.

## Scan and grading behavior

1. Require all four corner markers to be visible; otherwise show an actionable framing message.
2. Reject frames that are too blurry, too dark, severely glare-obstructed, or whose QR code does not match the active template and layout version.
3. Convert the detected sheet to a normalized, front-facing image based on the marker positions.
4. For each question, measure ink coverage in the known bubble regions.
5. Mark an option as selected only when it is sufficiently dark and clearly darker than the other options for that question.
6. Return **blank** when no option passes the mark threshold and **unclear** when multiple options pass it or the measurements are too close to distinguish.
7. Compare selected answers to the key. Correct answers count toward the score; incorrect, blank, and unclear answers do not.

The results screen must distinguish these states rather than treating every non-correct answer alike. It presents the score as `correct / total`, a percentage, and a per-question status. The teacher may retake the scan whenever it is unclear.

## Data and retention

Templates are persisted only on the device where they are created. A template contains its identifier, title, item count, option set, answer key, created and updated timestamps, and layout version. It contains no student information.

Camera frames and scan results are held only in memory for the active scan and discarded when the teacher starts another scan, closes the page, or refreshes it. The app must state this plainly near the scan workflow.

JSON backup contains a template and answer key. Importing it validates the same constraints as manual entry and CSV. Export does not include any captured image or scan result.

## Errors and recovery

| Situation | App response |
| --- | --- |
| Camera permission denied | Explain how to allow camera access in the browser and provide a retry button. |
| Page not detected | Keep the camera open and explain whether to include all corners, move closer, reduce glare, or improve light. |
| Wrong worksheet | Name the expected template and ask the teacher to choose the correct one. |
| Ambiguous marks | Identify the affected question numbers and show them separately from incorrect answers. |
| Invalid CSV | Keep the existing key unchanged and list every invalid row. |
| Local storage unavailable | Permit the current session but state that the template will not be retained after the page closes. |

## Usability and accessibility

- Large controls and high-contrast status messages support use on a phone while holding papers.
- The camera screen shows a live frame guide, capture button, detected-page indicator, and brief scan feedback.
- Non-camera actions, including template creation, key entry, PDF download, and results review, work on desktop and mobile.
- Status messages are textual as well as color-coded.

## Acceptance criteria

- A teacher can create an A–D or A–E worksheet with a chosen number of items and download a correctly numbered printable PDF.
- A teacher can fully enter a key manually or import a valid CSV; invalid CSV does not alter the template.
- A teacher can select a saved template, use a phone camera, and obtain a score from a clearly printed and filled sheet under ordinary indoor lighting.
- A scan refuses a cropped, wrong-template, or low-quality page and explains how to recover.
- Blank, double-marked, and uncertain answers are visible in the result and do not receive credit.
- Reloading the website on the same browser preserves saved templates; scan photos and results are absent after the scan session ends.
- No account, network request for user data, or server-side storage is required for the core workflow.

## Verification strategy

- Unit-test template validation, CSV parsing, scoring, pagination, template backup/import, and bubble-classification thresholds with deterministic image fixtures.
- Test generated PDFs for correct item numbering, option count, marker placement, layout-version code, and page breaks.
- Test the camera/form pipeline with a curated fixture set: flat pages, perspective distortion, moderate rotation, dim images, shadows, glare, blur, partial pages, blank answers, double marks, light marks, and wrong-template pages.
- Perform browser checks on current Android Chrome and iPhone Safari, including camera permission and rear-camera selection behavior.
- Conduct a small print-and-scan trial across common printers and several phone cameras before treating scan threshold values as production defaults.

## Delivery phases

1. Build template creation, manual/CSV answer keys, browser persistence, and PDF generation.
2. Implement camera capture, marker detection, rectification, bubble reading, and result display using fixed image fixtures.
3. Validate on physical printed sheets, tune thresholds, and add clear recovery messages.
4. Deploy the static application and document browser, printing, and lighting guidance.
