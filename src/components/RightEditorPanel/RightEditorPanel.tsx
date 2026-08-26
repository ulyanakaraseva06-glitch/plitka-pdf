import { ChangeEvent, DragEvent, ReactNode, useState } from 'react';
import { ImageIcon, ImageUp, ListChecks, Minus, Plus, RotateCcw, Shapes, Square, Table2, Trash2, Type, Wand2 } from 'lucide-react';
import { catalogIconCategories, catalogIcons, CatalogIconGlyph } from '../../data/iconLibrary';
import { DividerZone, EditableZone, FeatureZone, IconZone, ImageZone, PanelZone, TableZone, TextZone, ZoneStyle, ZoneStyleOverrideKey } from '../../types/project';
import { compressImage } from '../../utils/images';
import { ColorPickerPopover } from '../ColorPickerPopover/ColorPickerPopover';

type RightEditorPanelProps = {
  zone: EditableZone | null;
  onChange: (zone: EditableZone) => void;
  recentCustomColors: string[];
  onRememberCustomColor: (color: string) => void;
  onApplyLogoStyleToAllPages?: (zone: ImageZone) => void;
  onApplyZoneStyleToSameRole?: (zone: EditableZone) => void;
};

const MAX_TABLE_ROWS = 6;
const MAX_FEATURE_ITEMS = 4;
const DIVIDER_PERCENT_BASE = 0.375;
const TEXT_LIMITS: Record<NonNullable<TextZone['size']>, number> = {
  hero: 70,
  h1: 110,
  h2: 160,
  body: 420,
  small: 260,
  badge: 80
};

const defaultDividerColor = '#B7B7B7';
const defaultSwatches = ['#FFFFFF', '#F7F2EA', defaultDividerColor, '#C9C9D2', '#D8CAB8', '#2F3338', '#050505', '#9B79C6', '#D0A43A'];

function withStyle<T extends EditableZone>(zone: T, style: ZoneStyle, overrideKeys = Object.keys(style) as ZoneStyleOverrideKey[]): T {
  return {
    ...zone,
    style: { ...(zone.style ?? {}), ...style },
    styleOverrides: {
      ...(zone.styleOverrides ?? {}),
      ...Object.fromEntries(overrideKeys.map((key) => [key, true]))
    }
  };
}

function withOverrides<T extends EditableZone>(zone: T, keys: ZoneStyleOverrideKey[]): T {
  return {
    ...zone,
    styleOverrides: {
      ...(zone.styleOverrides ?? {}),
      ...Object.fromEntries(keys.map((key) => [key, true]))
    }
  };
}

function isLogoZone(zone: EditableZone): zone is ImageZone {
  if (zone.kind !== 'image') return false;
  const marker = `${zone.id} ${zone.label}`.toLowerCase();
  return marker.includes('logo') || marker.includes('логотип');
}

function zoneFallbackRole(zone: EditableZone): string {
  if (zone.styleRole) return zone.styleRole;
  const marker = `${zone.id} ${zone.label}`.toLowerCase();

  if (zone.kind === 'text') {
    if (marker.includes('pagetop') || marker.includes('pagebottom') || marker.includes('микроподпись') || marker.includes('выпуск')) return 'header-footer';
    if (marker.includes('heading') || marker.includes('заголовок')) return 'page-heading';
    if (marker.includes('title') || marker.includes('название каталога') || marker.includes('название коллекции') || marker.includes('название документа')) return 'document-title';
    if (marker.includes('intro') || marker.includes('subtitle') || marker.includes('description') || marker.includes('описание')) return 'collection-description';
    if (marker.includes('note') || marker.includes('notes') || marker.includes('примечание') || marker.includes('подпись')) return 'note';
    if (marker.includes('sku') || /^l\d+$/i.test(zone.id) || /^text\d+$/i.test(zone.id)) return 'sku-caption';
    if (marker.includes('product') || marker.includes('tiletext') || marker.includes('caption') || marker.includes('позиция') || marker.includes('образец')) return 'product-caption';
    if (marker.includes('company') || marker.includes('manager') || marker.includes('address') || marker.includes('website') || marker.includes('сайт') || marker.includes('адрес')) return 'contact-text';
    if (marker.includes('summary') || marker.includes('total') || marker.includes('итог') || marker.includes('next')) return 'summary';
    if (zone.size === 'hero' || zone.size === 'h1') return 'page-heading';
    return 'collection-description';
  }

  if (zone.kind === 'divider') {
    if (marker.includes('page')) return 'page-rule';
    if (marker.includes('product') || marker.includes('sku') || marker.includes('sample')) return 'product-rule';
    return 'content-rule';
  }

  if (zone.kind === 'panel') {
    return marker.includes('product') ? 'product-panel' : 'content-panel';
  }

  return `${zone.kind}-${zone.id}`;
}

function zoneRoleLabel(zone: EditableZone) {
  const role = zoneFallbackRole(zone);
  const labels: Record<string, string> = {
    'document-title': 'Название документа',
    'page-heading': 'Заголовок',
    'collection-description': 'Описание',
    note: 'Примечание',
    'product-caption': 'Описание товара',
    'sku-caption': 'Подпись SKU',
    'header-footer': 'Колонтитул',
    'contact-text': 'Контактный текст',
    summary: 'Итог / следующий шаг',
    'page-rule': 'Полоска страницы',
    'content-rule': 'Полоска контента',
    'product-rule': 'Полоска товара',
    'product-panel': 'Плашка товара',
    'content-panel': 'Плашка контента'
  };
  return labels[role];
}

function ColorControl({
  value,
  swatches,
  recentCustomColors,
  onChange,
  onRememberCustomColor,
  allowTransparent = false
}: {
  value: string;
  swatches: string[];
  recentCustomColors: string[];
  onChange: (color: string) => void;
  onRememberCustomColor: (color: string) => void;
  allowTransparent?: boolean;
}) {
  const isTransparent = value.toLowerCase() === 'transparent';
  return (
    <div className="color-input-row">
      <ColorPickerPopover
        value={isTransparent ? '#ffffff' : value}
        recentCustomColors={recentCustomColors}
        onChange={onChange}
        onRememberCustomColor={onRememberCustomColor}
        align="right"
      />
      <div className="swatches">
        {allowTransparent && (
          <button
            type="button"
            className={`transparent-swatch ${isTransparent ? 'active' : ''}`}
            onClick={() => onChange('transparent')}
            title="Без цвета"
            aria-label="Без цвета"
          />
        )}
        {swatches.map((color) => (
          <button
            key={color}
            type="button"
            className={value.toLowerCase() === color.toLowerCase() ? 'active' : ''}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
            title={color}
          />
        ))}
      </div>
    </div>
  );
}

function DesignControls({
  zone,
  onChange,
  recentCustomColors,
  onRememberCustomColor,
  text = true,
  background = true,
  shadow = true,
  radius = true,
  actionBeforeReset
}: {
  zone: EditableZone;
  onChange: (zone: EditableZone) => void;
  recentCustomColors: string[];
  onRememberCustomColor: (color: string) => void;
  text?: boolean;
  background?: boolean;
  shadow?: boolean;
  radius?: boolean;
  actionBeforeReset?: {
    label: string;
    onClick: () => void;
  };
}) {
  const currentTextColor = zone.style?.textColor ?? '#22242A';
  const currentBackground = zone.style?.backgroundColor ?? (zone.kind === 'divider' ? defaultDividerColor : zone.kind === 'image' ? 'transparent' : '#FFFFFF');
  const borderRadius = zone.style?.borderRadius ?? 0;
  const imageFit = zone.kind === 'image' ? zone.fit ?? (zone.imageRole === 'product' ? 'contain' : 'cover') : null;

  return (
    <section className="color-editor design-card">
      <div className="editor-subtitle">Дизайн блока</div>
      {zone.kind === 'image' && (
        <label className="field compact">
          <span>Вписать</span>
          <select value={imageFit ?? 'cover'} onChange={(event) => onChange(withOverrides({ ...zone, fit: event.target.value as ImageZone['fit'] }, ['fit']))}>
            <option value="cover">Заполнить блок</option>
            <option value="contain">Вписать целиком</option>
          </select>
        </label>
      )}
      {text && (
        <label className="field compact">
          <span>Цвет текста</span>
          <ColorControl
            value={currentTextColor}
            swatches={defaultSwatches}
            recentCustomColors={recentCustomColors}
            onChange={(color) => onChange(withStyle(zone, { textColor: color }))}
            onRememberCustomColor={onRememberCustomColor}
          />
        </label>
      )}
      {background && (
        <label className="field compact">
          <span>Фон блока</span>
          <ColorControl
            value={currentBackground}
            swatches={defaultSwatches}
            recentCustomColors={recentCustomColors}
            onChange={(color) => onChange(withStyle(zone, { backgroundColor: color }))}
            onRememberCustomColor={onRememberCustomColor}
            allowTransparent={zone.kind !== 'divider'}
          />
        </label>
      )}
      {radius && (
        <label className="field compact">
          <span>Скругление углов · {borderRadius}px</span>
          <input type="range" min="0" max="32" step="2" value={borderRadius} onChange={(event) => onChange(withStyle(zone, { borderRadius: Number(event.target.value) }))} />
        </label>
      )}
      {shadow && (
        <label className="field compact">
          <span>Тень</span>
          <select value={zone.style?.shadow ?? 'none'} onChange={(event) => onChange(withStyle(zone, { shadow: event.target.value as ZoneStyle['shadow'] }))}>
            <option value="none">Без тени</option>
            <option value="soft">Мягкая</option>
            <option value="medium">Средняя</option>
          </select>
        </label>
      )}
      {actionBeforeReset && (
        <button className="btn btn-ghost full apply-design-btn" onClick={actionBeforeReset.onClick}>
          {actionBeforeReset.label}
        </button>
      )}
      <button
        className="btn btn-ghost full reset-design-btn"
        onClick={() => onChange(zone.kind === 'image' ? ({ ...zone, fit: undefined, style: {}, styleOverrides: undefined } as ImageZone) : ({ ...zone, style: {}, styleOverrides: undefined } as EditableZone))}
      >
        <RotateCcw size={16} />Сбросить оформление
      </button>
    </section>
  );
}

function TextEditor({
  zone,
  onChange,
  recentCustomColors,
  onRememberCustomColor,
  onApplyZoneStyleToSameRole
}: {
  zone: TextZone;
  onChange: (zone: TextZone) => void;
  recentCustomColors: string[];
  onRememberCustomColor: (color: string) => void;
  onApplyZoneStyleToSameRole?: (zone: EditableZone) => void;
}) {
  const limit = TEXT_LIMITS[zone.size ?? 'body'];
  const isLong = zone.value.length > limit;

  return (
    <>
      <label className="field">
        <span>Текст · {zone.value.length}/{limit}</span>
        <textarea value={zone.value} onChange={(event) => onChange({ ...zone, value: event.target.value })} rows={7} />
      </label>
      {isLong && <div className="editor-warning">Текст может не поместиться в блок. Сократите его или выберите меньший размер.</div>}
      <div className="field-row">
        <label className="field">
          <span>Размер</span>
          <select value={zone.size ?? 'body'} onChange={(event) => onChange(withOverrides({ ...zone, size: event.target.value as TextZone['size'] }, ['size']))}>
            <option value="hero">Крупный</option>
            <option value="h1">Заголовок</option>
            <option value="h2">Подзаголовок</option>
            <option value="body">Обычный</option>
            <option value="small">Мелкий</option>
            <option value="badge">Плашка</option>
          </select>
        </label>
        <label className="field">
          <span>Выравнивание</span>
          <select value={zone.align ?? 'left'} onChange={(event) => onChange(withOverrides({ ...zone, align: event.target.value as TextZone['align'] }, ['align']))}>
            <option value="left">Слева</option>
            <option value="center">По центру</option>
            <option value="right">Справа</option>
          </select>
        </label>
      </div>
      <DesignControls
        zone={zone}
        onChange={(nextZone) => onChange(nextZone as TextZone)}
        recentCustomColors={recentCustomColors}
        onRememberCustomColor={onRememberCustomColor}
        actionBeforeReset={onApplyZoneStyleToSameRole ? {
          label: 'Применить ко всем таким блокам в документе',
          onClick: () => onApplyZoneStyleToSameRole(zone)
        } : undefined}
      />
    </>
  );
}

function ImageEditor({
  zone,
  onChange,
  recentCustomColors,
  onRememberCustomColor,
  onApplyLogoStyleToAllPages
}: {
  zone: ImageZone;
  onChange: (zone: ImageZone) => void;
  recentCustomColors: string[];
  onRememberCustomColor: (color: string) => void;
  onApplyLogoStyleToAllPages?: (zone: ImageZone) => void;
}) {
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const defaultFit = zone.imageRole === 'product' ? 'contain' : 'cover';
  const currentFit = zone.fit ?? defaultFit;
  const isLogo = isLogoZone(zone);

  async function uploadFile(file: File | undefined) {
    if (!file) return;
    setError('');
    try {
      const src = await compressImage(file);
      onChange({ ...zone, src, alt: file.name });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Не удалось загрузить изображение.');
    }
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    await uploadFile(file);
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    await uploadFile(event.dataTransfer.files?.[0]);
  }

  return (
    <>
      <section className="editor-card image-upload-card">
        <label className="field compact">
          <span>Название изображения</span>
          <input value={zone.alt} onChange={(event) => onChange({ ...zone, alt: event.target.value })} />
        </label>
        <div className="compact-note file-requirements">
          <span>JPG / PNG / WebP</span>
          <span>до 3 МБ</span>
        </div>
        <div
          className={`image-preview drop-image-preview ${dragActive ? 'drag-active' : ''}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <div className={`zone-image fit-${currentFit}`} style={{ backgroundImage: `url("${zone.src}")`, backgroundColor: zone.style?.backgroundColor ?? 'transparent' }} />
          <div className="drop-image-hint">
            <ImageUp size={18} />
            <span>Перетащите файл сюда</span>
          </div>
        </div>
        <label className="upload-button compact-upload-button">
          <ImageUp size={16} />
          Загрузить
          <input type="file" accept="image/*" onChange={handleFile} />
        </label>
      </section>
      {error && <div className="editor-warning">{error}</div>}
      <DesignControls
        zone={zone}
        onChange={(nextZone) => onChange(nextZone as ImageZone)}
        recentCustomColors={recentCustomColors}
        onRememberCustomColor={onRememberCustomColor}
        text={false}
        actionBeforeReset={isLogo && onApplyLogoStyleToAllPages ? {
          label: 'Применить оформление ко всем страницам',
          onClick: () => onApplyLogoStyleToAllPages(zone)
        } : undefined}
      />
    </>
  );
}

function DividerEditor({
  zone,
  onChange,
  recentCustomColors,
  onRememberCustomColor,
  onApplyZoneStyleToSameRole
}: {
  zone: DividerZone;
  onChange: (zone: DividerZone) => void;
  recentCustomColors: string[];
  onRememberCustomColor: (color: string) => void;
  onApplyZoneStyleToSameRole?: (zone: EditableZone) => void;
}) {
  const isVertical = zone.layout.w <= zone.layout.h;
  const thickness = isVertical ? zone.layout.w : zone.layout.h;
  const thicknessPercent = Math.round((thickness / DIVIDER_PERCENT_BASE) * 100);
  return (
    <>
      <section className="color-editor design-card">
        <label className="field compact">
          <span>Толщина полоски · {thicknessPercent}%</span>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={thicknessPercent}
            onChange={(event) => {
              const nextThickness = (Number(event.target.value) / 100) * DIVIDER_PERCENT_BASE;
              onChange(withOverrides({
                ...zone,
                layout: isVertical ? { ...zone.layout, w: nextThickness } : { ...zone.layout, h: nextThickness }
              }, ['dividerThickness']));
            }}
          />
        </label>
      </section>
      <DesignControls
        zone={zone}
        onChange={(nextZone) => onChange(nextZone as DividerZone)}
        recentCustomColors={recentCustomColors}
        onRememberCustomColor={onRememberCustomColor}
        text={false}
        background
        shadow
        radius={false}
        actionBeforeReset={onApplyZoneStyleToSameRole ? {
          label: 'Применить ко всем таким блокам в документе',
          onClick: () => onApplyZoneStyleToSameRole(zone)
        } : undefined}
      />
    </>
  );
}

function PanelEditor({
  zone,
  onChange,
  recentCustomColors,
  onRememberCustomColor,
  onApplyZoneStyleToSameRole
}: {
  zone: PanelZone;
  onChange: (zone: PanelZone) => void;
  recentCustomColors: string[];
  onRememberCustomColor: (color: string) => void;
  onApplyZoneStyleToSameRole?: (zone: EditableZone) => void;
}) {
  return (
    <DesignControls
      zone={zone}
      onChange={(nextZone) => onChange(nextZone as PanelZone)}
      recentCustomColors={recentCustomColors}
      onRememberCustomColor={onRememberCustomColor}
      text={false}
      background
      shadow
      radius
      actionBeforeReset={onApplyZoneStyleToSameRole ? {
        label: 'Применить ко всем таким блокам в документе',
        onClick: () => onApplyZoneStyleToSameRole(zone)
      } : undefined}
    />
  );
}

function zoneTypeInfo(zone: EditableZone): { label: string; icon: ReactNode } {
  const roleLabel = zoneRoleLabel(zone);
  if (zone.kind === 'text') return { label: roleLabel ?? 'Текст', icon: <Type size={16} /> };
  if (zone.kind === 'divider') return { label: roleLabel ?? 'Полоска', icon: <Minus size={16} /> };
  if (zone.kind === 'panel') return { label: roleLabel ?? 'Плашка', icon: <Square size={16} /> };
  if (zone.kind === 'image') return { label: isLogoZone(zone) ? 'Логотип' : 'Изображение', icon: <ImageIcon size={16} /> };
  if (zone.kind === 'icon') return { label: 'Иконки', icon: <Shapes size={16} /> };
  if (zone.kind === 'table') return { label: 'Таблица', icon: <Table2 size={16} /> };
  return { label: 'Список', icon: <ListChecks size={16} /> };
}

function TableEditor({ zone, onChange, recentCustomColors, onRememberCustomColor }: { zone: TableZone; onChange: (zone: TableZone) => void; recentCustomColors: string[]; onRememberCustomColor: (color: string) => void }) {
  function updateCell(rowIndex: number, columnId: string, value: string) {
    onChange({
      ...zone,
      rows: zone.rows.map((row, index) => (index === rowIndex ? { ...row, [columnId]: value } : row))
    });
  }

  function addRow() {
    if (zone.rows.length >= MAX_TABLE_ROWS) return;
    const row = Object.fromEntries(zone.columns.map((column) => [column.id, column.type === 'total' ? '' : '']));
    onChange({ ...zone, rows: [...zone.rows, row] });
  }

  return (
    <div className="table-editor">
      {zone.rows.map((row, rowIndex) => (
        <div className="table-row-editor" key={rowIndex}>
          <div className="row-title">
            <strong>Строка {rowIndex + 1}</strong>
            <button onClick={() => onChange({ ...zone, rows: zone.rows.filter((_, index) => index !== rowIndex) })} title="Удалить строку">
              <Trash2 size={14} />
            </button>
          </div>
          {zone.columns.filter((column) => column.type !== 'total').map((column) => (
            <label className="field compact" key={column.id}>
              <span>{column.label}</span>
              <input value={String(row[column.id] ?? '')} onChange={(event) => updateCell(rowIndex, column.id, event.target.value)} />
            </label>
          ))}
        </div>
      ))}
      <button className="btn btn-ghost full" onClick={addRow} disabled={zone.rows.length >= MAX_TABLE_ROWS}>
        <Plus size={16} />Добавить строку
      </button>
      {zone.rows.length >= MAX_TABLE_ROWS && <div className="editor-warning">Лимит этой таблицы — {MAX_TABLE_ROWS} строк, чтобы она не выходила за границы страницы.</div>}
      <DesignControls zone={zone} onChange={(nextZone) => onChange(nextZone as TableZone)} recentCustomColors={recentCustomColors} onRememberCustomColor={onRememberCustomColor} />
    </div>
  );
}

function FeatureEditor({ zone, onChange, recentCustomColors, onRememberCustomColor }: { zone: FeatureZone; onChange: (zone: FeatureZone) => void; recentCustomColors: string[]; onRememberCustomColor: (color: string) => void }) {
  const canAdd = zone.items.length < MAX_FEATURE_ITEMS;
  return (
    <div className="feature-editor">
      {zone.items.map((item, index) => (
        <label className="field" key={index}>
          <span>Пункт {index + 1}</span>
          <input
            value={item}
            onChange={(event) => onChange({ ...zone, items: zone.items.map((value, itemIndex) => itemIndex === index ? event.target.value : value) })}
          />
        </label>
      ))}
      <button
        className="btn btn-ghost full"
        onClick={() => canAdd && onChange({ ...zone, items: [...zone.items, 'Новый пункт'] })}
        disabled={!canAdd}
      >
        <Plus size={16} />Добавить пункт
      </button>
      {!canAdd && <div className="editor-warning">Лимит этого списка — {MAX_FEATURE_ITEMS} пункта, чтобы блок не выпадал за страницу.</div>}
      <DesignControls zone={zone} onChange={(nextZone) => onChange(nextZone as FeatureZone)} recentCustomColors={recentCustomColors} onRememberCustomColor={onRememberCustomColor} />
    </div>
  );
}

function IconZoneEditor({ zone, onChange, recentCustomColors, onRememberCustomColor }: { zone: IconZone; onChange: (zone: IconZone) => void; recentCustomColors: string[]; onRememberCustomColor: (color: string) => void }) {
  const mode = zone.mode ?? 'single';

  function updateItem(itemId: string, field: 'iconId' | 'label' | 'value', value: string) {
    onChange({
      ...zone,
      items: (zone.items ?? []).map((item) => (item.id === itemId ? { ...item, [field]: value } : item))
    });
  }

  function addItem() {
    const nextItems = zone.items ?? [];
    if (nextItems.length >= 6) return;
    onChange({
      ...zone,
      mode: 'row',
      items: [...nextItems, { id: `icon-item-${Date.now()}`, iconId: catalogIcons[0].id, label: 'Новый пункт', value: '' }]
    });
  }

  function selectedIconLabel(iconId?: string) {
    return catalogIcons.find((icon) => icon.id === iconId)?.label ?? catalogIcons[0].label;
  }

  return (
    <>
      <div className="field-row">
        <label className="field">
          <span>Режим</span>
          <select value={mode} onChange={(event) => onChange({ ...zone, mode: event.target.value as IconZone['mode'] })}>
            <option value="single">Одна иконка</option>
            <option value="row">Ряд иконок</option>
          </select>
        </label>
        <label className="field">
          <span>Размер</span>
          <select value={zone.size ?? 'md'} onChange={(event) => onChange({ ...zone, size: event.target.value as IconZone['size'] })}>
            <option value="sm">Малый</option>
            <option value="md">Средний</option>
            <option value="lg">Крупный</option>
          </select>
        </label>
      </div>

      {mode === 'single' ? (
        <>
          <label className="field">
            <span>Подпись</span>
            <input value={zone.caption ?? ''} onChange={(event) => onChange({ ...zone, caption: event.target.value })} />
          </label>
          <label className="field">
            <span>Значение</span>
            <input value={zone.value ?? ''} onChange={(event) => onChange({ ...zone, value: event.target.value })} />
          </label>
          <div className="icon-library">
            {catalogIconCategories.map((category) => (
              <section key={category.id}>
                <div className="editor-subtitle">{category.label}</div>
                <div className="icon-library-grid">
                  {catalogIcons.filter((icon) => icon.category === category.id).map((icon) => (
                    <button
                      key={icon.id}
                      className={`icon-option ${zone.iconId === icon.id ? 'active' : ''}`}
                      onClick={() => onChange({ ...zone, iconId: icon.id })}
                      title={icon.label}
                    >
                      <CatalogIconGlyph id={icon.id} size={18} />
                      <span>{icon.label}</span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      ) : (
        <div className="icon-row-editor">
          {(zone.items ?? []).map((item) => (
            <div key={item.id} className="table-row-editor">
              <div className="row-title">
                <strong>{item.label || 'Иконка'}</strong>
                <button onClick={() => onChange({ ...zone, items: (zone.items ?? []).filter((entry) => entry.id !== item.id) })} title="Удалить иконку">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="field compact">
                <span>Иконка</span>
                <details className="icon-choice">
                  <summary>
                    <CatalogIconGlyph id={item.iconId} size={16} />
                    <span>{selectedIconLabel(item.iconId)}</span>
                  </summary>
                  <div className="icon-choice-menu">
                    {catalogIconCategories.map((category) => (
                      <section key={category.id}>
                        <strong>{category.label}</strong>
                        <div className="icon-choice-grid">
                          {catalogIcons.filter((icon) => icon.category === category.id).map((icon) => (
                            <button
                              key={icon.id}
                              type="button"
                              className={item.iconId === icon.id ? 'active' : ''}
                              onClick={() => updateItem(item.id, 'iconId', icon.id)}
                            >
                              <CatalogIconGlyph id={icon.id} size={16} />
                              <span>{icon.label}</span>
                            </button>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </details>
              </div>
              <label className="field compact">
                <span>Подпись</span>
                <input value={item.label ?? ''} onChange={(event) => updateItem(item.id, 'label', event.target.value)} />
              </label>
              <label className="field compact">
                <span>Значение</span>
                <input value={item.value ?? ''} onChange={(event) => updateItem(item.id, 'value', event.target.value)} />
              </label>
            </div>
          ))}
          <button className="btn btn-ghost full" onClick={addItem} disabled={(zone.items ?? []).length >= 6}>
            <Plus size={16} />Добавить иконку
          </button>
        </div>
      )}

      <label className="field">
        <span>Выравнивание</span>
        <select value={zone.align ?? 'left'} onChange={(event) => onChange({ ...zone, align: event.target.value as IconZone['align'] })}>
          <option value="left">Слева</option>
          <option value="center">По центру</option>
          <option value="right">Справа</option>
        </select>
      </label>
      <DesignControls zone={zone} onChange={(nextZone) => onChange(nextZone as IconZone)} recentCustomColors={recentCustomColors} onRememberCustomColor={onRememberCustomColor} />
    </>
  );
}

export function RightEditorPanel({ zone, onChange, recentCustomColors, onRememberCustomColor, onApplyLogoStyleToAllPages, onApplyZoneStyleToSameRole }: RightEditorPanelProps) {
  if (!zone) {
    return (
      <section className="right-panel empty-editor">
        <div className="empty-icon"><Wand2 size={32} /></div>
        <strong>Выберите зону на странице для редактирования</strong>
        <span>Кликните на текст, изображение, таблицу или список внутри A4-страницы.</span>
      </section>
    );
  }

  const typeInfo = zoneTypeInfo(zone);

  return (
    <section className="right-panel">
      <div className="panel-heading">
        <div className="editor-heading-copy">
          <span>Редактирование</span>
          <div className="zone-type">
            {typeInfo.icon}
            {typeInfo.label}
          </div>
        </div>
        <div className="editor-heading-tools">
          <label className="hide-zone-control" title="Скрыть блок на странице и в PDF">
            <span>Скрыть</span>
            <input type="checkbox" checked={zone.visible === false} onChange={(event) => onChange({ ...zone, visible: !event.target.checked } as EditableZone)} />
          </label>
        </div>
      </div>

      {zone.kind === 'text' && (
        <TextEditor
          zone={zone}
          onChange={onChange}
          recentCustomColors={recentCustomColors}
          onRememberCustomColor={onRememberCustomColor}
          onApplyZoneStyleToSameRole={onApplyZoneStyleToSameRole}
        />
      )}
      {zone.kind === 'divider' && (
        <DividerEditor
          zone={zone}
          onChange={onChange}
          recentCustomColors={recentCustomColors}
          onRememberCustomColor={onRememberCustomColor}
          onApplyZoneStyleToSameRole={onApplyZoneStyleToSameRole}
        />
      )}
      {zone.kind === 'panel' && (
        <PanelEditor
          zone={zone}
          onChange={onChange}
          recentCustomColors={recentCustomColors}
          onRememberCustomColor={onRememberCustomColor}
          onApplyZoneStyleToSameRole={onApplyZoneStyleToSameRole}
        />
      )}
      {zone.kind === 'image' && (
        <ImageEditor
          zone={zone}
          onChange={onChange}
          recentCustomColors={recentCustomColors}
          onRememberCustomColor={onRememberCustomColor}
          onApplyLogoStyleToAllPages={onApplyLogoStyleToAllPages}
        />
      )}
      {zone.kind === 'icon' && <IconZoneEditor zone={zone} onChange={onChange} recentCustomColors={recentCustomColors} onRememberCustomColor={onRememberCustomColor} />}
      {zone.kind === 'table' && <TableEditor zone={zone} onChange={onChange} recentCustomColors={recentCustomColors} onRememberCustomColor={onRememberCustomColor} />}
      {zone.kind === 'features' && <FeatureEditor zone={zone} onChange={onChange} recentCustomColors={recentCustomColors} onRememberCustomColor={onRememberCustomColor} />}

    </section>
  );
}
