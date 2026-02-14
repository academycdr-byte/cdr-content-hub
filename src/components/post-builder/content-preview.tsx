'use client';

import { Film, LayoutGrid, Image, MessageCircle } from 'lucide-react';
import type { PostFormat } from '@/types';
import type { ContentFramework } from '@/lib/frameworks';

interface ContentPreviewProps {
  framework: ContentFramework;
  values: Record<string, string>;
  title: string;
  pillarColor: string;
  pillarName: string;
}

const FORMAT_ICONS: Record<PostFormat, React.ReactNode> = {
  REEL: <Film size={16} />,
  CAROUSEL: <LayoutGrid size={16} />,
  STATIC: <Image size={16} />,
  STORY: <MessageCircle size={16} />,
};

export default function ContentPreview({
  framework,
  values,
  title,
  pillarColor,
  pillarName,
}: ContentPreviewProps) {
  const hasContent = Object.values(values).some((v) => v.trim());

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <span style={{ color: pillarColor }}>
          {FORMAT_ICONS[framework.format]}
        </span>
        <h3 className="text-heading-3 text-text-primary">Preview</h3>
      </div>

      {!hasContent ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-text-tertiary">
            Preencha os campos do framework para ver o preview aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Post Title */}
          <div className="pb-3 border-b border-border-default">
            <p className="text-sm font-semibold text-text-primary">{title || 'Sem titulo'}</p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="badge text-[10px]"
                style={{
                  backgroundColor: `${pillarColor}15`,
                  color: pillarColor,
                }}
              >
                {pillarName}
              </span>
              <span className="text-[10px] text-text-tertiary">{framework.label}</span>
            </div>
          </div>

          {/* Framework Content */}
          {framework.fields.map((field) => {
            const value = values[field.key];
            if (!value?.trim()) return null;

            return (
              <div key={field.key}>
                <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">
                  {field.label}
                </p>
                <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                  {value}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
