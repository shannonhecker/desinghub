import { useId, type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { TEMPLATE_CATEGORIES, type TemplateCategory } from '@/lib/builderTemplates';

/* The connected workspace is the first choice and a different kind of one:
   several reports linked as one app. It sits above the individual templates
   as its own option; the category chips only narrow the cards under them. */
export function TemplateWorkspaceOption({ onWorkspace, disabled = false }: { onWorkspace: () => void; disabled?: boolean }) {
  const titleId = useId();
  const hintId = useId();
  return <section className="template-workspace" aria-labelledby={titleId}>
    <div className="template-workspace-text">
      <h3 id={titleId} className="template-workspace-title">Connected analytics workspace</h3>
      <p id={hintId} className="template-workspace-hint">Home, reports and settings, linked as one app.</p>
    </div>
    <button type="button" className="template-workspace-action" disabled={disabled} onClick={onWorkspace} aria-describedby={`${titleId} ${hintId}`}>
      Open workspace<ArrowRight className="template-workspace-arrow" aria-hidden="true" />
    </button>
  </section>;
}

/** The individual templates' heading row: label, category chips and, at the
 *  far end, whatever the surface adds (the chat row's previous / next). */
export function TemplateGalleryControls({ category, onCategory, children }: {
  category: TemplateCategory | 'all';
  onCategory: (category: TemplateCategory | 'all') => void;
  children?: ReactNode;
}) {
  return <div className="template-gallery-controls">
    <h3 className="template-gallery-label">Individual templates</h3>
    <div className="template-gallery-chips" role="group" aria-label="Template category">
      {[{ id: 'all' as const, label: 'All' }, ...TEMPLATE_CATEGORIES].map(item => <button
        key={item.id} type="button" className={`prompt-bubble template-gallery-chip${category === item.id ? ' is-active' : ''}`}
        aria-pressed={category === item.id} onClick={() => onCategory(item.id)}
      >{item.label}</button>)}
    </div>
    {children}
  </div>;
}
