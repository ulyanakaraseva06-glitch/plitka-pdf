import { HelpSections } from './HelpSections';
import { SitePageShell } from './SitePageShell';

export function HelpPage() {
  return (
    <SitePageShell
      wide
      eyebrow="Помощь"
      title="Как работать в Плитка PDF"
      lead="Короткий обзор рабочего стола и ответы на типичные вопросы: от первого документа до выгрузки PDF."
    >
      <HelpSections />
    </SitePageShell>
  );
}
