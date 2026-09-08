import { useState } from 'react';
import type { WorksheetTemplate } from '../domain/template';
import { templateStore } from '../storage/templateStore';

interface TemplateBackupProps {
  template: WorksheetTemplate;
  onImported(template: WorksheetTemplate): void;
}

export function TemplateBackup({ template, onImported }: TemplateBackupProps) {
  const [error, setError] = useState('');

  function download() {
    const json = templateStore.export(template);
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeFilename(template.title)}-backup.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importBackup(file: File | undefined) {
    if (!file) return;
    try {
      const imported = templateStore.import(await readFile(file));
      await templateStore.put(imported);
      setError('');
      onImported(imported);
    } catch {
      setError('That backup is not a valid worksheet template.');
    }
  }

  return (
    <div className="backup-controls">
      <button type="button" onClick={download}>Download worksheet backup</button>
      <label>
        Import worksheet backup
        <input aria-label="Import worksheet backup" type="file" accept="application/json,.json" onChange={event => void importBackup(event.currentTarget.files?.[0])} />
      </label>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function safeFilename(title: string): string {
  return title.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'worksheet';
}
