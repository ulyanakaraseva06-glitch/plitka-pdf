import { BadgePercent, BookOpen, FileText, Grid2X2, Maximize2, RotateCcw, Save, Star, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { visiblePresetSummaries } from '../../data/createProject';
import { DocumentRenderSettings, Page, PresetId, SavedTemplateMeta } from '../../types/project';
import { PdfPageRenderer } from '../PdfPageRenderer/PdfPageRenderer';

type CanvasProps = {
  page?: Page;
  renderSettings: DocumentRenderSettings;
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string | null) => void;
  onImageDrop?: (zoneId: string, file: File) => void;
  onCreateFromPreset?: (preset: PresetId) => void;
  userTemplates?: SavedTemplateMeta[];
  onCreateFromUserTemplate?: (templateId: string) => void;
  onCommitPageLayout?: (page: Page) => void;
};

const zoomSteps = [35, 50, 60, 75, 90, 100, 115, 130, 150, 175, 200];

const emptyPresetIcons: Record<PresetId, JSX.Element> = {
  mini_catalog: <BookOpen size={18} />,
  commercial_offer: <FileText size={18} />,
  price_list: <BadgePercent size={18} />,
  selection: <Star size={18} />,
  technical_package: <Grid2X2 size={18} />,
  moodboard_presentation: <Star size={18} />,
  premium_catalog: <BookOpen size={18} />,
  dealer_presentation: <Grid2X2 size={18} />,
  client_offer: <FileText size={18} />,
  empty: <BookOpen size={18} />
};

function getInitialZoom() {
  if (typeof window === 'undefined') return 100;
  if (window.innerHeight < 820 || window.innerWidth < 1450) return 75;
  if (window.innerWidth < 1700) return 90;
  return 100;
}

export function Canvas({
  page,
  renderSettings,
  selectedZoneId,
  onSelectZone,
  onImageDrop,
  onCreateFromPreset,
  userTemplates = [],
  onCreateFromUserTemplate,
  onCommitPageLayout
}: CanvasProps) {
  const [zoom, setZoom] = useState(getInitialZoom);
  const [fullscreen, setFullscreen] = useState(false);
  const [layoutEditMode, setLayoutEditMode] = useState(false);
  const [draftPage, setDraftPage] = useState<Page | undefined>(page);
  const [layoutBaseline, setLayoutBaseline] = useState<Page | null>(null);

  useEffect(() => {
    if (!layoutEditMode) setDraftPage(page);
  }, [page, layoutEditMode]);

  function startLayoutEditing() {
    if (!page) return;
    const snapshot = structuredClone(page);
    setLayoutBaseline(snapshot);
    setDraftPage(structuredClone(page));
    setLayoutEditMode(true);
  }

  function saveLayout() {
    if (!draftPage) return;
    onCommitPageLayout?.(draftPage);
    setLayoutEditMode(false);
  }

  function restoreLayout() {
    if (!layoutBaseline) return;
    const restored = structuredClone(layoutBaseline);
    setDraftPage(restored);
    onCommitPageLayout?.(restored);
    setLayoutEditMode(false);
    setLayoutBaseline(null);
  }

  const renderedPage = layoutEditMode ? draftPage : page;

  function changeZoom(direction: -1 | 1) {
    const index = zoomSteps.findIndex((item) => item === zoom);
    const nextIndex = Math.min(Math.max(index + direction, 0), zoomSteps.length - 1);
    setZoom(zoomSteps[nextIndex]);
  }

  const pageView = renderedPage ? (
    <div className="page-zoom-shell" style={{ transform: `scale(${zoom / 100})` }}>
      <PdfPageRenderer
        page={renderedPage}
        renderSettings={renderSettings}
        selectedZoneId={selectedZoneId}
        editorMode
        isLastPage={false}
        onSelectZone={onSelectZone}
        onImageDrop={onImageDrop}
        layoutEditMode={layoutEditMode}
        onZoneLayoutChange={(zoneId, layout) => setDraftPage((current) => current ? ({
          ...current,
          zones: { ...current.zones, [zoneId]: { ...current.zones[zoneId], layout } }
        }) : current)}
      />
    </div>
  ) : (
    <div className="empty-canvas">
      <strong>Добавьте страницу из библиотеки</strong>
      <span>или используйте готовый сценарий документа</span>
      <div className="empty-template-actions">
        {visiblePresetSummaries.map((item) => (
          <button key={item.id} type="button" onClick={() => onCreateFromPreset?.(item.id)}>
            {emptyPresetIcons[item.id]}
            <span className="empty-template-copy">
              <strong>{item.label}</strong>
              <small>{item.pageCount} стр. · {item.audience}</small>
            </span>
          </button>
        ))}
      </div>
      {userTemplates.length > 0 && (
        <div className="empty-user-templates">
          <span>Ваши шаблоны</span>
          <div className="empty-template-actions user-template-actions">
            {userTemplates.slice(0, 6).map((template) => (
              <button key={template.id} type="button" onClick={() => onCreateFromUserTemplate?.(template.id)}>
                <Star size={18} />
                <span>{template.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <section className="canvas-wrap">
      <div className="canvas-toolbar">
        <div className="layout-toolbar-actions">
          <button className={`btn btn-ghost ${layoutEditMode ? 'active' : ''}`} onClick={startLayoutEditing} disabled={!page || layoutEditMode}>Редактировать</button>
          <button className="btn btn-primary" onClick={saveLayout} disabled={!layoutEditMode}><Save size={16} />Сохранить</button>
          <button className="btn btn-ghost" onClick={restoreLayout} disabled={!layoutBaseline}><RotateCcw size={16} />Вернуть</button>
        </div>
        <span>{zoom}%</span>
        <button className="tool" title="Уменьшить" onClick={() => changeZoom(-1)} disabled={zoom === zoomSteps[0]}>
          <ZoomOut size={17} />
        </button>
        <button className="tool" title="Увеличить" onClick={() => changeZoom(1)} disabled={zoom === zoomSteps[zoomSteps.length - 1]}>
          <ZoomIn size={17} />
        </button>
        <button className="tool" title="Полноэкранный просмотр" onClick={() => setFullscreen(true)}>
          <Maximize2 size={17} />
        </button>
      </div>
      <div className={`canvas-stage ${layoutEditMode ? 'layout-grid-active' : ''}`} onClick={() => onSelectZone(null)}>
        {pageView}
      </div>

      {fullscreen && page && (
        <div className="fullscreen-page-view" onClick={() => setFullscreen(false)}>
          <button className="btn btn-ghost" onClick={() => setFullscreen(false)}>Закрыть просмотр</button>
          <PdfPageRenderer
            page={page}
            renderSettings={renderSettings}
            isLastPage={false}
          />
        </div>
      )}
    </section>
  );
}
