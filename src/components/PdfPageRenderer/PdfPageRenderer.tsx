import { CSSProperties } from 'react';
import { Accent, DocumentRenderSettings, EditableZone, IconZone, ImageZone, Page, PageFormat, TableZone, TextPalette, ThemeMode, ZoneStyleOverrideKey } from '../../types/project';
import { CatalogIconGlyph } from '../../data/iconLibrary';
import { formatMoney, rowTotal } from '../../utils/calculations';
import { getTemplate } from '../../data/pageTemplates';

type PdfPageRendererProps = {
  page: Page;
  renderSettings?: DocumentRenderSettings;
  pageFormat?: PageFormat;
  documentTheme?: ThemeMode;
  documentAccent?: Accent;
  documentAccentColor?: string;
  documentBackgroundColor?: string;
  documentTextPalette?: TextPalette;
  documentTextPrimaryColor?: string;
  documentTextSecondaryColor?: string;
  documentDividerColor?: string;
  showLogos?: boolean;
  showPageNumbers?: boolean;
  showDividers?: boolean;
  forcePageNumber?: boolean;
  selectedZoneId?: string | null;
  editorMode?: boolean;
  isLastPage?: boolean;
  exportMode?: boolean;
  onSelectZone?: (zoneId: string) => void;
  onImageDrop?: (zoneId: string, file: File) => void;
};

const templatePrimaryTextColors = new Set(['#242321', '#1f2227', '#111111', '#3f4246', '#f3eee6']);
const templateMutedTextColors = new Set(['#6f6a63', '#8a8d8f', '#704a32', '#d8cab8', '#2c3035', '#c9c9d2']);
const defaultDividerColor = '#B7B7B7';

function normalizedColor(color?: string) {
  return color?.trim().toLowerCase();
}

function textTone(zone: EditableZone) {
  const color = normalizedColor(zone.style?.textColor);
  if (!color) return 'primary';
  if (templateMutedTextColors.has(color)) return 'muted';
  return 'primary';
}

function templateZone(page: Page, zone: EditableZone) {
  try {
    return getTemplate(page.templateId).defaultZones[zone.id];
  } catch {
    return undefined;
  }
}

function styleOverride(page: Page, zone: EditableZone, key: ZoneStyleOverrideKey) {
  if (zone.styleOverrides?.[key]) return true;
  const template = templateZone(page, zone);
  if (!template) return false;
  if (key === 'textColor' || key === 'backgroundColor' || key === 'borderRadius' || key === 'shadow') {
    return zone.style?.[key] !== template.style?.[key];
  }
  if (key === 'fit' && zone.kind === 'image' && template.kind === 'image') return zone.fit !== template.fit;
  if (key === 'align' && zone.kind === 'text' && template.kind === 'text') return zone.align !== template.align;
  if (key === 'size' && zone.kind === 'text' && template.kind === 'text') return zone.size !== template.size;
  if (key === 'dividerThickness' && zone.kind === 'divider' && template.kind === 'divider') {
    return zone.layout.h !== template.layout.h || zone.layout.w !== template.layout.w;
  }
  return false;
}

function isLightTemplatePanelBackground(color?: string) {
  const normalized = normalizedColor(color);
  return normalized === '#ffffff' || normalized === '#fff' || normalized === '#f7f4ef' || normalized === '#fff8ed';
}

function shouldUseInlineTextColor(page: Page, zone: EditableZone, hasDocumentTextOverride: boolean) {
  const color = normalizedColor(zone.style?.textColor);
  if (!color) return false;
  if (zone.kind === 'image') return true;
  if (zone.kind === 'divider') return false;
  if (zone.kind === 'panel') return false;
  if (zone.kind === 'text' && styleOverride(page, zone, 'textColor')) return true;
  if (zone.kind === 'text' && hasDocumentTextOverride) return false;
  return !templatePrimaryTextColors.has(color) && !templateMutedTextColors.has(color);
}

export function isLogoZone(zone: EditableZone): zone is ImageZone {
  return `${zone.id} ${zone.label}`.toLowerCase().includes('logo') || `${zone.id} ${zone.label}`.toLowerCase().includes('логотип');
}

function zoneStyle(page: Page, zone: EditableZone, documentTheme: ThemeMode, documentDividerColor?: string, hasDocumentTextOverride = false): CSSProperties {
  const shadow = zone.style?.shadow;
  const hasLocalBackground = styleOverride(page, zone, 'backgroundColor');
  const resolvedBackgroundColor = zone.kind === 'divider'
    ? hasLocalBackground
      ? zone.style?.backgroundColor ?? defaultDividerColor
      : documentDividerColor ?? zone.style?.backgroundColor ?? defaultDividerColor
    : documentTheme === 'dark' && !hasLocalBackground && isLightTemplatePanelBackground(zone.style?.backgroundColor)
      ? 'rgba(42, 45, 49, 0.92)'
      : zone.style?.backgroundColor;
  return {
    left: `${zone.layout.x}%`,
    top: `${zone.layout.y}%`,
    width: `${zone.layout.w}%`,
    height: `${zone.layout.h}%`,
    color: shouldUseInlineTextColor(page, zone, hasDocumentTextOverride) ? zone.style?.textColor : undefined,
    backgroundColor: zone.kind === 'divider' ? undefined : resolvedBackgroundColor,
    ...(zone.kind === 'divider' ? { '--divider-color': resolvedBackgroundColor } : {}),
    borderRadius: zone.style?.borderRadius ? `${zone.style.borderRadius}px` : undefined,
    boxShadow: shadow === 'soft'
      ? '0 10px 24px rgba(0, 0, 0, 0.12)'
      : shadow === 'medium'
        ? '0 18px 42px rgba(0, 0, 0, 0.18)'
        : undefined
  };
}

function hexToSoftAccent(color?: string) {
  if (!color?.startsWith('#')) return undefined;
  const hex = color.slice(1);
  const normalized = hex.length === 3
    ? hex.split('').map((char) => `${char}${char}`).join('')
    : hex;
  if (normalized.length !== 6) return undefined;
  const value = Number.parseInt(normalized, 16);
  if (Number.isNaN(value)) return undefined;
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, 0.18)`;
}

function renderTable(zone: TableZone) {
  return (
    <table className="pdf-table">
      <thead>
        <tr>
          {zone.columns.map((column) => <th key={column.id}>{column.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {zone.rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {zone.columns.map((column) => {
              const value = column.type === 'total' ? formatMoney(rowTotal(row)) : row[column.id];
              return <td key={column.id}>{String(value ?? '')}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function imageFit(zone: ImageZone) {
  if (zone.fit) return zone.fit;
  if (zone.imageRole === 'product') return 'contain';
  return 'cover';
}

function iconPixelSize(zone: IconZone) {
  if (zone.size === 'sm') return 16;
  if (zone.size === 'lg') return 28;
  return 21;
}

function renderIconZone(zone: IconZone) {
  const size = iconPixelSize(zone);
  const align = zone.align ?? 'left';

  if (zone.mode === 'row') {
    return (
      <div className={`icon-zone icon-row align-${align}`}>
        {(zone.items ?? []).map((item) => (
          <div key={item.id} className="icon-row-item">
            <div className="icon-glyph-wrap"><CatalogIconGlyph id={item.iconId} size={size} /></div>
            {item.label && <strong>{item.label}</strong>}
            {item.value && <span>{item.value}</span>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`icon-zone icon-single align-${align}`}>
      <div className="icon-glyph-wrap"><CatalogIconGlyph id={zone.iconId} size={size + 4} /></div>
      {zone.caption && <strong>{zone.caption}</strong>}
      {zone.value && <span>{zone.value}</span>}
    </div>
  );
}

function ZoneView({ zone }: { zone: EditableZone }) {
  if (zone.kind === 'divider') return <div className="divider-zone" aria-hidden="true" />;
  if (zone.kind === 'panel') return <div className="panel-zone" aria-hidden="true" />;
  if (zone.kind === 'image') {
    return (
      <div
        className={`zone-image fit-${imageFit(zone)}`}
        role="img"
        aria-label={zone.alt}
        style={{ backgroundImage: `url("${zone.src}")` }}
      />
    );
  }
  if (zone.kind === 'table') return renderTable(zone);
  if (zone.kind === 'icon') return renderIconZone(zone);
  if (zone.kind === 'features') {
    return (
      <div className="feature-list">
        {zone.items.map((item, index) => (
          <div key={`${item}-${index}`}><span>{index + 1}</span>{item}</div>
        ))}
      </div>
    );
  }
  return <div className={`text-zone text-${zone.size ?? 'body'} text-tone-${textTone(zone)} align-${zone.align ?? 'left'}`}>{zone.value}</div>;
}

export function PdfPageRenderer(props: PdfPageRendererProps) {
  const {
    page,
    renderSettings,
    pageFormat = 'a4_portrait',
    documentTheme = 'light',
    documentAccent = 'purple',
    documentAccentColor,
    documentBackgroundColor,
    documentTextPalette = 'classic',
    documentTextPrimaryColor,
    documentTextSecondaryColor,
    documentDividerColor,
    showLogos = true,
    showPageNumbers = true,
    showDividers = true,
    forcePageNumber = false,
    selectedZoneId,
    editorMode,
    isLastPage,
    exportMode,
    onSelectZone,
    onImageDrop
  } = props;
  const resolvedPageFormat = renderSettings?.pageFormat ?? pageFormat;
  const resolvedDocumentTheme = renderSettings?.documentTheme ?? documentTheme;
  const resolvedDocumentAccent = renderSettings?.documentAccent ?? documentAccent;
  const resolvedDocumentAccentColor = renderSettings?.documentAccentColor ?? documentAccentColor;
  const resolvedDocumentBackgroundColor = renderSettings?.documentBackgroundColor ?? documentBackgroundColor;
  const resolvedDocumentTextPalette = renderSettings?.documentTextPalette ?? documentTextPalette;
  const resolvedDocumentTextPrimaryColor = renderSettings?.documentTextPrimaryColor ?? documentTextPrimaryColor;
  const resolvedDocumentTextSecondaryColor = renderSettings?.documentTextSecondaryColor ?? documentTextSecondaryColor;
  const resolvedDocumentDividerColor = renderSettings?.documentDividerColor ?? documentDividerColor;
  const resolvedShowLogos = renderSettings?.showLogos ?? showLogos;
  const resolvedShowPageNumbers = renderSettings?.showPageNumbers ?? showPageNumbers;
  const resolvedShowDividers = renderSettings?.showDividers ?? showDividers;
  const showPageNumber = resolvedShowPageNumbers && (forcePageNumber || page.order > 0);
  const hasDocumentTextOverride = Boolean(resolvedDocumentTextPrimaryColor || resolvedDocumentTextSecondaryColor);
  const documentStyle = {
    ...(resolvedDocumentAccentColor ? { '--document-accent': resolvedDocumentAccentColor } : {}),
    ...(resolvedDocumentAccentColor ? { '--document-accent-soft': hexToSoftAccent(resolvedDocumentAccentColor) } : {}),
    ...(resolvedDocumentBackgroundColor ? { '--document-bg': resolvedDocumentBackgroundColor } : {}),
    ...(resolvedDocumentTextPrimaryColor ? { '--document-text': resolvedDocumentTextPrimaryColor } : {}),
    ...(resolvedDocumentTextSecondaryColor ? { '--document-text-muted': resolvedDocumentTextSecondaryColor } : {})
  } as CSSProperties;

  return (
    <article
      className={`pdf-page template-${page.templateId} format-${resolvedPageFormat}`}
      data-document-theme={resolvedDocumentTheme}
      data-document-accent={resolvedDocumentAccent}
      data-text-palette={resolvedDocumentTextPalette}
      data-export-page={exportMode ? 'true' : undefined}
      style={documentStyle}
    >
      <div className="page-watermark" />
      {Object.values(page.zones).filter((zone) => zone.id !== 'footerBrand' && zone.visible !== false && (resolvedShowDividers || zone.kind !== 'divider') && (resolvedShowLogos || !isLogoZone(zone))).map((zone) => {
        const className = `page-zone zone-${zone.kind} text-tone-${textTone(zone)} ${editorMode ? 'editable' : ''} ${selectedZoneId === zone.id ? 'selected' : ''}`;
        const style = zoneStyle(page, zone, resolvedDocumentTheme, resolvedDocumentDividerColor, hasDocumentTextOverride);

        if (!editorMode) {
          return (
            <div key={zone.id} className={className} style={style}>
              <ZoneView zone={zone} />
            </div>
          );
        }

        return (
          <button
            key={zone.id}
            type="button"
            className={className}
            style={style}
            onClick={(event) => {
              if (!onSelectZone) return;
              event.stopPropagation();
              onSelectZone(zone.id);
            }}
            onDragOver={(event) => {
              if (zone.kind !== 'image' || !onImageDrop) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = 'copy';
            }}
            onDrop={(event) => {
              if (zone.kind !== 'image' || !onImageDrop) return;
              const file = event.dataTransfer.files?.[0];
              if (!file) return;
              event.preventDefault();
              event.stopPropagation();
              onImageDrop(zone.id, file);
            }}
          >
            <ZoneView zone={zone} />
          </button>
        );
      })}
      {showPageNumber && (
        <footer className="pdf-page-footer">
          <strong>{String(page.order + 1).padStart(2, '0')}</strong>
        </footer>
      )}
      {isLastPage && (
        <div className="pdf-signature">
          Разработано с помощью plitka-pdf.ru
        </div>
      )}
    </article>
  );
}
