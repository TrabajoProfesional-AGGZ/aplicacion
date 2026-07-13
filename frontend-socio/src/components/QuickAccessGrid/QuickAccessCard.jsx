import { ChevronRight } from 'lucide-react';

export function QuickAccessCard({ icon: Icon, titulo, desc, onClick, variant = 'featured' }) {
  const isRow = variant === 'row';

  return (
    <button
      type="button"
      className={isRow ? 'qa-row' : 'qa-featured'}
      onClick={onClick}
    >
      <span className={isRow ? 'qa-row-icon' : 'qa-featured-icon'}>
        <Icon size={isRow ? 18 : 22} />
      </span>
      <span className={isRow ? 'qa-row-text' : 'qa-featured-text'}>
        <span className={isRow ? 'qa-row-title' : 'qa-featured-title'}>{titulo}</span>
        <span className={isRow ? 'qa-row-desc' : 'qa-featured-desc'}>{desc}</span>
      </span>
      <ChevronRight size={isRow ? 16 : 20} className="qa-chevron" aria-hidden="true" />
    </button>
  );
}
