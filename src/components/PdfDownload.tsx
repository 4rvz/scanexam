import { useState } from 'react';
import type { WorksheetTemplate } from '../domain/template';
import { createAnswerSheetPdf } from '../pdf/answerSheetPdf';

export function PdfDownload({ template }: { template: WorksheetTemplate }) {
  const [error, setError] = useState('');

  async function download() {
    try {
      const pdf = await createAnswerSheetPdf(template);
      const url = URL.createObjectURL(pdf);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeFilename(template.title)}-answer-sheet.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setError('');
    } catch {
      setError('The answer sheet PDF could not be created. Please try again.');
    }
  }

  return (
    <div>
      <button type="button" onClick={() => void download()}>Download answer sheet PDF</button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

function safeFilename(title: string): string {
  return title.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'worksheet';
}
