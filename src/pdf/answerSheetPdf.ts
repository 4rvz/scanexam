import { jsPDF } from 'jspdf';
import * as QRCode from 'qrcode';
import { getAllPageLayouts, type PageLayout } from '../domain/layout';
import type { WorksheetTemplate } from '../domain/template';

export interface AnswerSheetPdfDocument {
  addPage(format: 'a4', orientation: 'portrait'): void;
  setFont(fontName: string, fontStyle: string): void;
  setFontSize(size: number): void;
  text(value: string, x: number, y: number): void;
  setFillColor(red: number, green: number, blue: number): void;
  rect(x: number, y: number, width: number, height: number, style: 'F'): void;
  setDrawColor(red: number, green: number, blue: number): void;
  setLineWidth(width: number): void;
  circle(x: number, y: number, radius: number, style: 'S'): void;
  addImage(data: string, format: 'PNG', x: number, y: number, width: number, height: number): void;
}

type QrDataUrlFactory = (payload: string) => Promise<string>;

export async function createAnswerSheetPdf(template: WorksheetTemplate): Promise<Blob> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  await renderAnswerSheetPdf(pdf, template, createQrDataUrl);
  return pdf.output('blob');
}

export async function renderAnswerSheetPdf(
  pdf: AnswerSheetPdfDocument,
  template: WorksheetTemplate,
  createQrDataUrl: QrDataUrlFactory,
): Promise<void> {
  const layouts = getAllPageLayouts(template);
  for (const [pageIndex, layout] of layouts.entries()) {
    if (pageIndex > 0) pdf.addPage('a4', 'portrait');
    await drawPage(pdf, template, layout, createQrDataUrl);
  }
}

async function drawPage(
  pdf: AnswerSheetPdfDocument,
  template: WorksheetTemplate,
  layout: PageLayout,
  createQrDataUrl: QrDataUrlFactory,
): Promise<void> {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text(template.title, 18, 26);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Page ${layout.pageIndex + 1}`, 18, 33);
  pdf.setFontSize(8);
  pdf.text('Use a dark pencil or pen. Fill one bubble completely. Print at actual size (100%).', 18, 40);
  pdf.text('Do not use fit-to-page or scaling. Use dark, fully filled marks.', 18, 44);

  for (const marker of layout.markers) {
    pdf.setFillColor(0, 0, 0);
    pdf.rect(marker.x, marker.y, marker.size, marker.size, 'F');
  }

  const qrDataUrl = await createQrDataUrl(JSON.stringify(layout.qrCode.payload));
  pdf.addImage(qrDataUrl, 'PNG', layout.qrCode.x, layout.qrCode.y, layout.qrCode.size, layout.qrCode.size);

  for (const question of layout.questions) {
    pdf.setFontSize(9);
    pdf.text(`${question.number}.`, question.numberPosition.x, question.numberPosition.y + 1.5);
    for (const [option, bubble] of Object.entries(question.bubbles)) {
      if (!bubble) continue;
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.35);
      pdf.circle(bubble.x, bubble.y, bubble.radius, 'S');
      pdf.setFontSize(7);
      pdf.text(option, bubble.x - 1.2, bubble.y + 1);
    }
  }
}

function createQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 0,
    width: 200,
  });
}
