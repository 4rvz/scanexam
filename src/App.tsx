import { useState } from 'react';
import { AnswerKeyEditor } from './components/AnswerKeyEditor';
import { CameraScanner } from './components/CameraScanner';
import { TemplateEditor } from './components/TemplateEditor';
import type { WorksheetTemplate } from './domain/template';

type TeacherScreen = 'home' | 'worksheet' | 'answer-key' | 'scan';

export default function App() {
  const [screen, setScreen] = useState<TeacherScreen>('home');
  const [selectedTemplate, setSelectedTemplate] = useState<WorksheetTemplate>();

  function showAnswerKey(template?: WorksheetTemplate) {
    if (template) setSelectedTemplate(template);
    setScreen('answer-key');
  }

  function clearDeletedTemplate(template: WorksheetTemplate) {
    if (selectedTemplate?.id === template.id) {
      setSelectedTemplate(undefined);
      setScreen('worksheet');
    }
  }

  return (
    <main>
      <h1>Exam Checker</h1>
      <nav aria-label="Main actions">
        <button type="button" onClick={() => setScreen('worksheet')}>Create worksheet</button>
        <button type="button" onClick={() => showAnswerKey()}>Answer key</button>
        <button type="button" aria-describedby="scan-guidance" onClick={() => setScreen('scan')}>Scan sheets</button>
      </nav>
      <p id="scan-guidance">Select a worksheet, then open Scan sheets to capture answer sheets.</p>
      {screen === 'worksheet' && (
        <TemplateEditor
          onSaved={template => showAnswerKey(template)}
          onSelected={template => showAnswerKey(template)}
          onDeleted={clearDeletedTemplate}
        />
      )}
      {screen === 'answer-key' && (selectedTemplate ? (
        <AnswerKeyEditor template={selectedTemplate} onSaved={setSelectedTemplate} />
      ) : (
        <section aria-labelledby="choose-worksheet-heading">
          <h2 id="choose-worksheet-heading">Choose a worksheet first</h2>
          <p>Create or select a worksheet before entering its answer key.</p>
          <button type="button" onClick={() => setScreen('worksheet')}>Create worksheet</button>
        </section>
      ))}
      {screen === 'scan' && (selectedTemplate ? (
        <CameraScanner template={selectedTemplate} onScanned={() => undefined} onError={() => undefined} />
      ) : (
        <section aria-labelledby="choose-scan-worksheet-heading">
          <h2 id="choose-scan-worksheet-heading">Choose a worksheet first</h2>
          <p>Create or select a worksheet before scanning its answer sheets.</p>
          <button type="button" onClick={() => setScreen('worksheet')}>Create worksheet</button>
        </section>
      ))}
    </main>
  );
}
