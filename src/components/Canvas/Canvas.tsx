import { BadgePercent, BookOpen, FileText, Grid2X2, Maximize2, Star, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';
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
  onCreateFromUserTemplate
}: CanvasProps) {
  const [zoom, setZoom] = useState(getInitialZoom);
  const [fullscreen, setFullscreen] = useState(false);

  function changeZoom(direction: -1 | 1) {
    const index = zoomSteps.findIndex((item) => item === zoom);
    const nextIndex = Math.min(Math.max(index + direction, 0), zoomSteps.length - 1);
    setZoom(zoomSteps[nextIndex]);
  }

  const pageView = page ? (
    <div className="page-zoom-shell" style={{ transform: `scale(${zoom / 100})` }}>
      <PdfPageRenderer
        page={page}
        renderSettings={renderSettings}
        selectedZoneId={selectedZoneId}
        editorMode
        isLastPage={false}
        onSelectZone={onSelectZone}
        onImageDrop={onImageDrop}
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
      <div className="canvas-stage" onClick={() => onSelectZone(null)}>
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
