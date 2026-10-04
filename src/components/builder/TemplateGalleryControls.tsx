import { TEMPLATE_CATEGORIES, type TemplateCategory } from '@/lib/builderTemplates';

export function TemplateGalleryControls({ category, onCategory, onWorkspace, disabled = false }: {
  category: TemplateCategory | 'all';
  onCategory: (category: TemplateCategory | 'all') => void;
  onWorkspace: () => void;
  disabled?: boolean;
}) {
  return <div className="template-gallery-controls">
    <div className="template-gallery-chips" role="group" aria-label="Template category">
      {[{ id: 'all' as const, label: 'All' }, ...TEMPLATE_CATEGORIES].map(item => <button
        key={item.id} type="button" className={`prompt-bubble template-gallery-chip${category === item.id ? ' is-active' : ''}`}
        aria-pressed={category === item.id} onClick={() => onCategory(item.id)}
      >{item.label}</button>)}
    </div>
    {category !== 'general' && <button type="button" className="prompt-bubble template-workspace-action" disabled={disabled} onClick={onWorkspace}>
      Open connected analytics workspace
    </button>}
  </div>;
}
