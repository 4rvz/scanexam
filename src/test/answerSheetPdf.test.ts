import { describe, expect, it } from 'vitest';
import { getPageLayout } from '../domain/layout';
import { createAnswerSheetPdf, renderAnswerSheetPdf, type AnswerSheetPdfDocument } from '../pdf/answerSheetPdf';
import type { WorksheetTemplate } from '../domain/template';

function templateWith(overrides: Partial<WorksheetTemplate> = {}): WorksheetTemplate {
  return {
    id: 'template-456',
    title: 'Science',
    itemCount: 20,
    optionCount: 4,
    answers: {},
    layoutVersion: 1,
    createdAt: '2026-09-08T00:00:00.000Z',
    updatedAt: '2026-09-08T00:00:00.000Z',
    ...overrides,
  };
}

describe('answer-sheet PDF generation', () => {
  it('creates a substantial PDF for a 51-item worksheet', async () => {
    const pdf = await createAnswerSheetPdf(templateWith({ itemCount: 51 }));

    expect(pdf.type).toBe('application/pdf');
    expect(pdf.size).toBeGreaterThan(1_000);
  });

  it('renders both 51-item pages with their questions, markers, QR payloads, and print guidance', async () => {
    const document = new RecordingPdf();
    const encodedQrPayloads: string[] = [];
    const template = templateWith({ id: 'science-51', itemCount: 51, layoutVersion: 1 });

    await renderAnswerSheetPdf(
      document,
      template,
      async (payload) => {
        encodedQrPayloads.push(payload);
        return 'data:image/png;base64,QR';
      },
    );

    expect(document.pages).toHaveLength(2);
    expect(questionNumbers(document.pages[0].text)).toEqual(Array.from({ length: 50 }, (_, index) => index + 1));
    expect(questionNumbers(document.pages[1].text)).toEqual([51]);
    expect(document.pages.map((page) => page.rectangles)).toEqual([4, 4]);
    expect(document.pages.map((page) => page.images)).toEqual([
      [qrPlacement(getPageLayout(template, 0).qrCode)],
      [qrPlacement(getPageLayout(template, 1).qrCode)],
    ]);
    expect(encodedQrPayloads.map((payload) => JSON.parse(payload))).toEqual([
      { templateId: 'science-51', layoutVersion: 1, pageIndex: 0 },
      { templateId: 'science-51', layoutVersion: 1, pageIndex: 1 },
    ]);
    expect(document.pages[0].text.join(' ')).toContain(
      'Print at actual size (100%). Do not use fit-to-page or scaling. Use dark, fully filled marks.',
    );
  });
});

interface RecordedPage {
  text: string[];
  rectangles: number;
  images: Array<{ x: number; y: number; width: number; height: number }>;
}

class RecordingPdf implements AnswerSheetPdfDocument {
  readonly pages: RecordedPage[] = [{ text: [], rectangles: 0, images: [] }];
  private currentPage = 0;

  addPage(): void {
    this.pages.push({ text: [], rectangles: 0, images: [] });
    this.currentPage += 1;
  }

  setFont(): void {}

  setFontSize(): void {}

  text(value: string): void {
    this.pages[this.currentPage].text.push(value);
  }

  setFillColor(): void {}

  rect(): void {
    this.pages[this.currentPage].rectangles += 1;
  }

  setDrawColor(): void {}

  setLineWidth(): void {}

  circle(): void {}

  addImage(_data: string, _format: 'PNG', x: number, y: number, width: number, height: number): void {
    this.pages[this.currentPage].images.push({ x, y, width, height });
  }
}

function questionNumbers(text: string[]): number[] {
  return text
    .map((value) => /^([1-9]\d*)\.$/.exec(value)?.[1])
    .filter((value): value is string => value !== undefined)
    .map(Number);
}

function qrPlacement(qrCode: { x: number; y: number; size: number }): { x: number; y: number; width: number; height: number } {
  return { x: qrCode.x, y: qrCode.y, width: qrCode.size, height: qrCode.size };
}
