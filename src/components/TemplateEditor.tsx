import { useEffect, useState } from 'react';
import { createTemplate, validateTemplateInput, type OptionCount, type WorksheetTemplate } from '../domain/template';
import { templateStore } from '../storage/templateStore';

interface TemplateEditorProps {
  onSaved(template: WorksheetTemplate): void;
  onSelected?(template: WorksheetTemplate): void;
}

export function TemplateEditor({ onSaved, onSelected }: TemplateEditorProps) {
  const [title, setTitle] = useState('');
  const [itemCount, setItemCount] = useState(20);
  const [optionCount, setOptionCount] = useState<OptionCount>(4);
  const [templates, setTemplates] = useState<WorksheetTemplate[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    void refreshTemplates();
  }, []);

  async function refreshTemplates() {
    setTemplates(await templateStore.list());
  }

  async function save() {
    const validationErrors = validateTemplateInput({ title, itemCount, optionCount });
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const template = createTemplate({ title: title.trim(), itemCount, optionCount });
    await templateStore.put(template);
    await refreshTemplates();
    setErrors([]);
    onSaved(template);
  }

  async function remove(template: WorksheetTemplate) {
    await templateStore.remove(template.id);
    await refreshTemplates();
  }

  return (
    <section aria-labelledby="worksheet-heading">
      <h2 id="worksheet-heading">Create worksheet</h2>
      <form onSubmit={event => { event.preventDefault(); void save(); }}>
        <label>
          Worksheet title
          <input aria-label="Worksheet title" value={title} onChange={event => setTitle(event.target.value)} />
        </label>
        <label>
          Item count
          <input aria-label="Item count" type="number" min="1" max="200" value={itemCount} onChange={event => setItemCount(Number(event.target.value))} />
        </label>
        <label>
          Answer choices
          <select aria-label="Answer choices" value={optionCount} onChange={event => setOptionCount(Number(event.target.value) as OptionCount)}>
            <option value={4}>A–D</option>
            <option value={5}>A–E</option>
          </select>
        </label>
        {errors.length > 0 && (
          <ul role="alert">
            {errors.map(error => <li key={error}>{error}</li>)}
          </ul>
        )}
        <button type="submit">Save worksheet</button>
      </form>

      <h3>Saved worksheets</h3>
      {templates.length === 0 ? <p>No worksheets saved yet.</p> : (
        <ul className="template-list">
          {templates.map(template => (
            <li key={template.id}>
              <button type="button" onClick={() => onSelected?.(template)}>{template.title}</button>
              <span>{template.itemCount} questions, {template.optionCount} choices</span>
              <button type="button" onClick={() => void remove(template)} aria-label={`Delete ${template.title}`}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
