import { AboutSections } from './AboutSections';
import { SitePageShell } from './SitePageShell';

export function AboutPage() {
  return (
    <SitePageShell
      wide
      eyebrow="О сервисе"
      title="Плитка PDF — сервис для каталогов, прайсов и подборок"
      lead="Рабочий инструмент Vilray Studio для поставщиков, салонов и производителей плитки: собрать аккуратный PDF из готовых страниц и отправить клиенту."
    >
      <AboutSections />
    </SitePageShell>
  );
}
