'use client';

import { cn } from '@/lib/utils';
import type { ContentFramework } from '@/lib/frameworks';

interface FrameworkEditorProps {
  framework: ContentFramework;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export default function FrameworkEditor({ framework, values, onChange }: FrameworkEditorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-heading-3 text-text-primary">
          Framework: {framework.label}
        </h3>
        <span className="text-xs text-text-tertiary">
          {framework.description}
        </span>
      </div>

      {framework.fields.map((field, index) => (
        <div key={field.key} className="animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
          <label
            htmlFor={`field-${field.key}`}
            className={cn(
              'text-label mb-1.5 block',
              field.required ? 'text-text-primary' : 'text-text-secondary'
            )}
          >
            {field.label}
            {field.required && <span className="text-error ml-0.5">*</span>}
          </label>

          {field.type === 'textarea' ? (
            <textarea
              id={`field-${field.key}`}
              value={values[field.key] || ''}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="input min-h-[80px] resize-y"
              rows={3}
            />
          ) : (
            <input
              id={`field-${field.key}`}
              type="text"
              value={values[field.key] || ''}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="input"
            />
          )}
        </div>
      ))}
    </div>
  );
}
