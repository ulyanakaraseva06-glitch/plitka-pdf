import { useEffect } from 'react';
import { X } from 'lucide-react';
import { AboutSections } from '../../site/AboutSections';
import { HelpSections } from '../../site/HelpSections';

export type SiteInfoKind = 'help' | 'about';

type SiteInfoModalProps = {
  kind: SiteInfoKind;
  onKindChange: (kind: SiteInfoKind) => void;
  onClose: () => void;
};

const copy: Record<SiteInfoKind, { eyebrow: string; title: string; lead: string }> = {
  help: {
    eyebrow: 'Помощь',
    title: 'Как работать в Плитка PDF',
    lead: 'Короткий обзор рабочего стола и ответы на типичные вопросы: от первого документа до выгрузки PDF.'
  },
  about: {
    eyebrow: 'О сервисе',
    title: 'Плитка PDF — сервис для каталогов, прайсов и подборок',
    lead: 'Рабочий инструмент Vilray Studio для поставщиков, салонов и производителей плитки: собрать аккуратный PDF из готовых страниц и отправить клиенту.'
  }
};

export function SiteInfoModal({ kind, onKindChange, onClose }: SiteInfoModalProps) {
  const meta = copy[kind];

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop site-info-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="site-info-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-info-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="close-btn" type="button" onClick={onClose} title="Закрыть" aria-label="Закрыть">
          <X size={22} />
        </button>

        <header className="site-info-modal-header">
          <div className="site-info-modal-tabs" role="tablist" aria-label="Разделы">
            <button
              type="button"
              role="tab"
              aria-selected={kind === 'help'}
              className={kind === 'help' ? 'active' : ''}
              onClick={() => onKindChange('help')}
            >
              Помощь
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={kind === 'about'}
              className={kind === 'about' ? 'active' : ''}
              onClick={() => onKindChange('about')}
            >
              О сервисе
            </button>
          </div>
          <span>{meta.eyebrow}</span>
          <h2 id="site-info-modal-title">{meta.title}</h2>
          <p>{meta.lead}</p>
        </header>

        <div className="site-info-modal-content">
          {kind === 'help' ? <HelpSections /> : <AboutSections />}
        </div>
      </section>
    </div>
  );
}
