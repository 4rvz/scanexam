import { useEffect, useState } from 'react';
import { parseAnswerKeyCsv } from '../domain/csv';
import type { AnswerOption, WorksheetTemplate } from '../domain/template';
import { templateStore } from '../storage/templateStore';
import { PdfDownload } from './PdfDownload';
import { TemplateBackup } from './TemplateBackup';

interface AnswerKeyEditorProps {
  template: WorksheetTemplate;
  onSaved(template: WorksheetTemplate): void;
}

export function AnswerKeyEditor({ template, onSaved }: AnswerKeyEditorProps) {
  const [answers, setAnswers] = useState<Record<number, AnswerOption>>(template.answers);
  const [errors, setErrors] = useState<string[]>([]);
  const options = ['A', 'B', 'C', 'D', 'E'].slice(0, template.optionCount) as AnswerOption[];

  useEffect(() => {
    setAnswers(template.answers);
    setErrors([]);
  }, [template]);

  function chooseAnswer(question: number, answer: AnswerOption) {
    setAnswers(current => ({ ...current, [question]: answer }));
    setErrors([]);
  }

  async function importCsv(file: File | undefined) {
    if (!file) return;
    const result = parseAnswerKeyCsv(await readFile(file), template.itemCount, template.optionCount);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setAnswers(result.answers);
    setErrors([]);
  }

  async function save() {
    const missing = Array.from({ length: template.itemCount }, (_, index) => index + 1)
      .filter(question => !answers[question]);
    if (missing.length > 0) {
      setErrors(['Select one answer for every question before saving.']);
      return;
    }

    const savedTemplate = { ...template, answers, updatedAt: new Date().toISOString() };
    await templateStore.put(savedTemplate);
    setErrors([]);
    onSaved(savedTemplate);
  }

  return (
    <section aria-labelledby="answer-key-heading">
      <h2 id="answer-key-heading">Answer key: {template.title}</h2>
      <label>
        Answer key CSV
        <input aria-label="Answer key CSV" type="file" accept="text/csv,.csv" onChange={event => void importCsv(event.currentTarget.files?.[0])} />
      </label>
      {errors.length > 0 && (
        <ul role="alert">
          {errors.map(error => <li key={error}>{error}</li>)}
        </ul>
      )}
      <div className="answer-grid">
        {Array.from({ length: template.itemCount }, (_, index) => index + 1).map(question => (
          <fieldset key={question} aria-label={`Question ${question}`}>
            <legend>Question {question}</legend>
            {options.map(option => (
              <button
                key={option}
                type="button"
                aria-pressed={answers[question] === option}
                onClick={() => chooseAnswer(question, option)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    chooseAnswer(question, option);
                  }
                }}
              >
                {option}
              </button>
            ))}
          </fieldset>
        ))}
      </div>
      <button type="button" onClick={() => void save()}>Save answer key</button>
      <PdfDownload template={{ ...template, answers }} />
      <TemplateBackup template={{ ...template, answers }} onImported={onSaved} />
    </section>
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
