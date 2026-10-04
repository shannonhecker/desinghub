import { useId } from 'react';
import { ArrowRight } from 'lucide-react';
import { TEMPLATE_CATEGORIES, type TemplateCategory } from '@/lib/builderTemplates';

/* Category chips narrow the individual templates. The connected workspace is
   a different kind of choice (several reports linked as one app), so it sits
   apart from the filters as its own described action, not as another chip. */
export function TemplateGalleryControls({ category, onCategory, onWorkspace, disabled = false }: {
  category: TemplateCategory | 'all';
  onCategory: (category: TemplateCategory | 'all') => void;
  onWorkspace: () => void;
  disabled?: boolean;
}) {
  const hintId = useId();
  return <div className="template-gallery-controls">
    <div className="template-gallery-chips" role="group" aria-label="Template category">
      {[{ id: 'all' as const, label: 'All' }, ...TEMPLATE_CATEGORIES].map(item => <button
        key={item.id} type="button" className={`prompt-bubble template-gallery-chip${category === item.id ? ' is-active' : ''}`}
        aria-pressed={category === item.id} onClick={() => onCategory(item.id)}
      >{item.label}</button>)}
    </div>
    {category !== 'general' && <div className="template-workspace">
      <button type="button" className="template-workspace-action" disabled={disabled} onClick={onWorkspace} aria-describedby={hintId}>
        Open connected analytics workspace<ArrowRight className="template-workspace-arrow" aria-hidden="true" />
      </button>
      <span id={hintId} className="template-workspace-hint">Home, reports and settings, linked as one app</span>
    </div>}
  </div>;
}
