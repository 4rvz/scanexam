import { jsPDF } from 'jspdf';
import * as QRCode from 'qrcode';
import { getAllPageLayouts, type PageLayout } from '../domain/layout';
import type { WorksheetTemplate } from '../domain/template';

export async function createAnswerSheetPdf(template: WorksheetTemplate): Promise<Blob> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const layouts = getAllPageLayouts(template);

  for (const [pageIndex, layout] of layouts.entries()) {
    if (pageIndex > 0) pdf.addPage('a4', 'portrait');
    await drawPage(pdf, template, layout);
  }

  return pdf.output('blob');
}

async function drawPage(pdf: jsPDF, template: WorksheetTemplate, layout: PageLayout): Promise<void> {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text(template.title, 18, 26);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Page ${layout.pageIndex + 1}`, 18, 33);
  pdf.setFontSize(8);
  pdf.text('Use a dark pencil or pen. Fill one bubble completely. Print at actual size (100%).', 18, 40);

  for (const marker of layout.markers) {
    pdf.setFillColor(0, 0, 0);
    pdf.rect(marker.x, marker.y, marker.size, marker.size, 'F');
  }

  const qrDataUrl = await QRCode.toDataURL(JSON.stringify(layout.qrCode.payload), {
    errorCorrectionLevel: 'M',
    margin: 0,
    width: 200,
  });
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
