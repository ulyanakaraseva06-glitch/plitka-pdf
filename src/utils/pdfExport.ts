import { PageFormat } from '../types/project';

const COLOR_FUNCTION_PATTERN = /color\(\s*srgb\s+([^)]*)\)/gi;
const COLOR_STYLE_PROPERTIES = [
  'background-color',
  'border-bottom-color',
  'border-left-color',
  'border-right-color',
  'border-top-color',
  'box-shadow',
  'caret-color',
  'color',
  'column-rule-color',
  'fill',
  'outline-color',
  'stroke',
  'text-decoration-color',
  'text-emphasis-color',
  'text-shadow',
  '-webkit-text-fill-color',
  '-webkit-text-stroke-color'
] as const;

function srgbChannelToByte(channel: string): number | null {
  const value = Number.parseFloat(channel);
  if (!Number.isFinite(value)) return null;
  return Math.round(Math.min(1, Math.max(0, value)) * 255);
}

function srgbColorToRgba(contents: string, originalColor: string): string {
  const [channelsPart, alphaPart] = contents.split('/').map((part) => part.trim());
  const channels = channelsPart.split(/\s+/);
  if (channels.length !== 3) return originalColor;

  const rgb = channels.map(srgbChannelToByte);
  if (rgb.some((channel) => channel === null)) return originalColor;

  const parsedAlpha = alphaPart ? Number.parseFloat(alphaPart) : 1;
  const alpha = Number.isFinite(parsedAlpha) ? Math.min(1, Math.max(0, parsedAlpha)) : 1;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function replaceUnsupportedColors(value: string): string {
  return value.replace(COLOR_FUNCTION_PATTERN, (color, contents: string) => srgbColorToRgba(contents, color));
}

function normalizeColorsForCanvas(sourceElement: HTMLElement, clonedElement: HTMLElement): void {
  const sourceNodes = [sourceElement, ...Array.from(sourceElement.querySelectorAll<HTMLElement>('*'))];
  const clonedNodes = [clonedElement, ...Array.from(clonedElement.querySelectorAll<HTMLElement>('*'))];

  sourceNodes.forEach((sourceNode, index) => {
    const clonedNode = clonedNodes[index];
    if (!clonedNode) return;

    const computedStyle = window.getComputedStyle(sourceNode);
    COLOR_STYLE_PROPERTIES.forEach((property) => {
      const value = computedStyle.getPropertyValue(property);
      if (!value.includes('color(')) return;
      clonedNode.style.setProperty(property, replaceUnsupportedColors(value), 'important');
    });
  });
}

export async function exportElementsToPdf(elements: HTMLElement[], filename: string, pageFormat: PageFormat = 'a4_portrait'): Promise<void> {
  if (!elements.length) {
    throw new Error('Не найдены страницы для PDF-экспорта.');
  }

  const [{ default: html2canvas }, jspdfModule] = await Promise.all([
    import('html2canvas'),
    import('jspdf')
  ]);
  const PdfConstructor = jspdfModule.default ?? jspdfModule.jsPDF;

  const isLandscape = pageFormat === 'a4_landscape';
  const pdf = new PdfConstructor({ orientation: isLandscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = isLandscape ? 297 : 210;
  const pageHeight = isLandscape ? 210 : 297;

  for (let index = 0; index < elements.length; index += 1) {
    const canvas = await html2canvas(elements[index], {
      scale: 2.2,
      backgroundColor: '#ffffff',
      useCORS: true,
      onclone: (_document, clonedElement) => {
        normalizeColorsForCanvas(elements[index], clonedElement);
      }
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.96);
    if (index > 0) pdf.addPage('a4', isLandscape ? 'landscape' : 'portrait');
    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
  }

  pdf.save(filename.replace(/[\\/:*?"<>|]+/g, '-'));
}
