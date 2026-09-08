# Task 2 report: worksheet, answer, and grading domain rules

## Changes

- Added `src/domain/template.ts` with `OptionCount`, `AnswerOption`, `WorksheetTemplate`, `validateTemplateInput`, and `createTemplate`.
- Added `src/domain/scoring.ts` with explicit `DetectedAnswer` states (`selected`, `blank`, and `unclear`), `ItemResult`, `GradeResult`, and pure `gradeAnswers` logic.
- Added focused tests in `src/test/template.test.ts` and `src/test/scoring.test.ts`.

Template validation returns the required stable messages for missing titles, item counts outside 1–200, and option counts other than 4 or 5. Template creation initializes an empty answer key, layout version 1, UUID, and matching ISO timestamps. Grading defaults absent detections to blank, counts selected mismatches as incorrect, and preserves per-item results.

## TDD evidence

### RED

Command:

```text
npm run test -- src/test/template.test.ts
```

Result: failed during test collection because `../domain/template` did not exist:

```text
Error: Failed to resolve import "../domain/template" from "src/test/template.test.ts".
```

This was the expected missing-export/missing-module failure before production implementation.

### GREEN

Command:

```text
npm run test -- src/test/template.test.ts src/test/scoring.test.ts
```

Result:

```text
Test Files  2 passed (2)
Tests  5 passed (5)
```

## Verification

Command:

```text
npm test
```

Result:

```text
Test Files  3 passed (3)
Tests  6 passed (6)
```

Command:

```text
npm run build
```

Result: TypeScript compilation and Vite production build both passed; Vite transformed 31 modules and emitted the production bundle.

## Self-review

The implementation is limited to the requested domain modules and their tests. It uses the exact validation strings and type shapes from the task brief. The grading counters are mutually exclusive by detected state, and every key item receives an item result even when the scanner omitted a detection.

## Concerns

The task brief specifies `crypto.randomUUID()` directly. Runtime support for that API is therefore assumed by template creation; no fallback was added.
