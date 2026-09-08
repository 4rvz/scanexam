import { useState } from 'react';
import { AnswerKeyEditor } from './components/AnswerKeyEditor';
import { TemplateEditor } from './components/TemplateEditor';
import type { WorksheetTemplate } from './domain/template';

type TeacherScreen = 'home' | 'worksheet' | 'answer-key';

export default function App() {
  const [screen, setScreen] = useState<TeacherScreen>('home');
  const [selectedTemplate, setSelectedTemplate] = useState<WorksheetTemplate>();

  function showAnswerKey(template?: WorksheetTemplate) {
    if (template) setSelectedTemplate(template);
    setScreen('answer-key');
  }

  return (
    <main>
      <h1>Exam Checker</h1>
      <nav aria-label="Main actions">
        <button type="button" onClick={() => setScreen('worksheet')}>Create worksheet</button>
        <button type="button" onClick={() => showAnswerKey()}>Answer key</button>
        <button type="button">Scan sheets</button>
      </nav>
      {screen === 'worksheet' && (
        <TemplateEditor
          onSaved={template => showAnswerKey(template)}
          onSelected={template => showAnswerKey(template)}
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
    </main>
  );
}
