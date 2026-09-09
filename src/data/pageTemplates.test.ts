import { describe, expect, it } from 'vitest';
import { allPageTemplates, getTemplate, pageTemplates } from './pageTemplates';
import { templatePreviewPage } from '../components/PageTemplateCard/PageTemplateCard';

describe('pageTemplates registry', () => {
  it('exposes the compact visible library', () => {
    expect(pageTemplates).toHaveLength(42);
    expect(allPageTemplates).toHaveLength(65);
    expect(allPageTemplates.filter((template) => template.libraryStatus === 'legacy')).toHaveLength(3);
    expect(allPageTemplates.filter((template) => template.libraryStatus === 'hidden')).toHaveLength(20);
  });

  it('resolves templates by id through the shared registry index', () => {
    const template = pageTemplates[0];

    expect(getTemplate(template.id)).toBe(template);
  });

  it('returns a stable preview page object for the same template', () => {
    const template = pageTemplates[0];

    expect(templatePreviewPage(template)).toBe(templatePreviewPage(template));
  });

  it('throws for an unknown template id', () => {
    expect(() => getTemplate('missing-template')).toThrow('Template not found: missing-template');
  });

  it('registers the reference-derived template set', () => {
    const ids = [
      'cover_reference_year_statement',
      'catalog_reference_material_bands',
      'catalog_reference_room_palette',
      'catalog_reference_dual_scene',
      'catalog_reference_color_story',
      'catalog_reference_outdoor_story',
      'catalog_reference_outdoor_system',
      'catalog_brand_technology_story',
      'catalog_reference_dark_index'
    ];

    expect(ids.map((id) => getTemplate(id).id)).toEqual(ids);
  });

  it('classifies compatibility-only templates as legacy or hidden', () => {
    expect(getTemplate('cover_dark_statement').libraryStatus).toBe('hidden');
    expect(getTemplate('catalog_reference_dark_index').libraryStatus).toBe('legacy');
    expect(getTemplate('catalog_interior_two_large_tiles').libraryStatus).toBe('legacy');
    expect(getTemplate('catalog_full_interior_slab_specs').libraryStatus).toBe('legacy');
    expect(getTemplate('catalog_vertical_room_slab').libraryStatus).toBe('hidden');
    expect(getTemplate('catalog_collection_index').libraryStatus).toBe('hidden');
    expect(getTemplate('catalog_interior_sku_spread').libraryStatus).toBe('hidden');
    expect(getTemplate('catalog_interior_products_split').libraryStatus).toBe('hidden');
    expect(getTemplate('catalog_interior_large_tile_focus').libraryStatus).toBe('hidden');
    expect(getTemplate('catalog_two_interiors_large_tile').libraryStatus).toBe('hidden');
    expect(getTemplate('catalog_product_grid_12').libraryStatus).toBe('hidden');
    expect(getTemplate('catalog_image_product_pair').libraryStatus).toBe('hidden');
    expect(getTemplate('catalog_image_two_products').libraryStatus).toBe('hidden');
    expect(getTemplate('catalog_interiors_gallery').libraryStatus).toBe('hidden');
    expect(getTemplate('catalog_scene_companion_products').libraryStatus).toBe('hidden');
    expect(getTemplate('catalog_color_variants_matrix').libraryStatus).toBe('hidden');
    expect(getTemplate('contacts_qr_placeholder').libraryStatus).toBe('hidden');
  });

  it('registers the outdoor collection template set', () => {
    const ids = [
      'catalog_outdoor_collection_scene',
      'catalog_outdoor_copy_column',
      'catalog_outdoor_dual_scene',
      'catalog_outdoor_sku_quad',
      'catalog_outdoor_sku_mixed',
      'catalog_outdoor_sku_planks',
      'catalog_outdoor_install_cards',
      'catalog_outdoor_install_guide'
    ];

    expect(ids.map((id) => getTemplate(id).id)).toEqual(ids);
    expect(ids.every((id) => getTemplate(id).libraryStatus === 'core')).toBe(true);
  });

  it('keeps outdoor collection zones inside the page bounds', () => {
    const outdoorTemplates = allPageTemplates.filter((item) => item.id.includes('_outdoor_'));

    expect(outdoorTemplates.length).toBeGreaterThanOrEqual(8);
    for (const item of outdoorTemplates) {
      for (const zone of Object.values(item.defaultZones)) {
        expect(zone.layout.x).toBeGreaterThanOrEqual(0);
        expect(zone.layout.y).toBeGreaterThanOrEqual(0);
        expect(zone.layout.x + zone.layout.w).toBeLessThanOrEqual(100);
        expect(zone.layout.y + zone.layout.h).toBeLessThanOrEqual(100);
      }
    }
  });

  it('keeps reference-derived zones inside the page bounds', () => {
    const referenceTemplates = pageTemplates.filter((item) => item.id.includes('_reference_'));

    for (const item of referenceTemplates) {
      for (const zone of Object.values(item.defaultZones)) {
        expect(zone.layout.x).toBeGreaterThanOrEqual(0);
        expect(zone.layout.y).toBeGreaterThanOrEqual(0);
        expect(zone.layout.x + zone.layout.w).toBeLessThanOrEqual(100);
        expect(zone.layout.y + zone.layout.h).toBeLessThanOrEqual(100);
      }
    }
  });
});
