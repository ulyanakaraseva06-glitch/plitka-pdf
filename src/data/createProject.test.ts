import { describe, expect, it } from 'vitest';
import { createProject, getPresetLabel, getPresetPreferredSchemeId, presetLabels, visiblePresetSummaries } from './createProject';

describe('createProject presets', () => {
  it('registers the new scenario labels', () => {
    expect(presetLabels.premium_catalog).toBe('Премиальный каталог коллекции');
    expect(presetLabels.dealer_presentation).toBe('Дилерская презентация');
    expect(presetLabels.client_offer).toBe('КП для клиента');
    expect(presetLabels.outdoor_collection).toBe('Каталог outdoor-коллекции');
    expect(Object.keys(presetLabels)).toHaveLength(6);
    expect(getPresetLabel('mini_catalog')).toBe('Мини-каталог');
  });

  it('exposes visible preset summaries for the UI', () => {
    expect(visiblePresetSummaries).toHaveLength(6);
    expect(visiblePresetSummaries.map((item) => item.id)).toEqual([
      'premium_catalog',
      'outdoor_collection',
      'dealer_presentation',
      'client_offer',
      'price_list',
      'selection'
    ]);
    expect(visiblePresetSummaries.map((item) => item.pageCount)).toEqual([8, 8, 9, 7, 7, 8]);
    expect(visiblePresetSummaries.every((item) => item.description.length > 0)).toBe(true);
    expect(visiblePresetSummaries.every((item) => item.audience.length > 0)).toBe(true);
  });

  it('builds the premium catalog scenario from reference-derived pages', () => {
    const project = createProject('premium_catalog');

    expect(project.title).toBe('Pietra Nuvola Premium Catalogue');
    expect(project.showLogos).toBe(false);
    expect(project.pages.map((page) => page.templateId)).toEqual([
      'cover_reference_year_statement',
      'catalog_reference_material_bands',
      'catalog_reference_room_palette',
      'catalog_collection_comparison',
      'catalog_reference_dual_scene',
      'catalog_brand_technology_story',
      'catalog_reference_outdoor_story',
      'contacts_next_step'
    ]);

    const coverTitle = project.pages[0].zones.title;
    expect(coverTitle.kind).toBe('text');
    if (coverTitle.kind !== 'text') throw new Error('Expected text zone');
    expect(coverTitle.value).toContain('PIETRA NUVOLA');
  });

  it('builds the dealer presentation with patched pricing data', () => {
    const project = createProject('dealer_presentation');
    const quotePage = project.pages.find((page) => page.templateId === 'price_visual_quote');

    expect(project.companyProfile.managerName).toBe('Отдел дилерских продаж');
    expect(quotePage).toBeTruthy();
    if (!quotePage) throw new Error('Missing dealer quote page');

    const quoteTable = quotePage.zones.table;
    expect(quoteTable.kind).toBe('table');
    if (quoteTable.kind !== 'table') throw new Error('Expected table zone');
    expect(quoteTable.rows).toHaveLength(4);
    expect(quoteTable.rows[0].quantity).toBe(120);
  });

  it('builds the client offer with a compact summary sequence', () => {
    const project = createProject('client_offer');

    expect(project.pages).toHaveLength(7);
    expect(project.companyProfile.email).toBe('hello@vilray.studio');

    const summaryPage = project.pages.find((page) => page.templateId === 'price_summary_offer');
    expect(summaryPage).toBeTruthy();
    if (!summaryPage) throw new Error('Missing summary page');

    const summaryText = summaryPage.zones.summary;
    expect(summaryText.kind).toBe('text');
    if (summaryText.kind !== 'text') throw new Error('Expected text zone');
    expect(summaryText.value).toContain('121 м2');
  });

  it('builds the selection scenario from comparison-first pages', () => {
    const project = createProject('selection');

    expect(project.pages.map((page) => page.templateId)).toEqual([
      'cover_materials_intro',
      'catalog_collection_comparison',
      'catalog_project_case',
      'catalog_two_interiors_two_tiles',
      'catalog_cross_sell_companions',
      'catalog_surface_finish_detail',
      'catalog_product_cards_6',
      'contacts_next_step'
    ]);
  });

  it('exposes recommended schemes for the new scenarios', () => {
    expect(getPresetPreferredSchemeId('premium_catalog')).toBe('minimal');
    expect(getPresetPreferredSchemeId('dealer_presentation')).toBe('dealer');
    expect(getPresetPreferredSchemeId('client_offer')).toBe('warm_catalog');
    expect(getPresetPreferredSchemeId('outdoor_collection')).toBe('warm_catalog');
  });

  it('builds the outdoor collection catalogue from dedicated page templates', () => {
    const project = createProject('outdoor_collection');

    expect(project.title).toBe('Outdoor Collection Catalogue');
    expect(project.pageFormat).toBe('a4_landscape');
    expect(project.showLogos).toBe(false);
    expect(project.pages).toHaveLength(8);
    expect(project.pages.map((page) => page.templateId)).toEqual([
      'catalog_outdoor_collection_scene',
      'catalog_outdoor_copy_column',
      'catalog_outdoor_dual_scene',
      'catalog_outdoor_sku_quad',
      'catalog_outdoor_sku_mixed',
      'catalog_outdoor_sku_planks',
      'catalog_outdoor_install_cards',
      'catalog_outdoor_install_guide'
    ]);

    const firstHeading = project.pages[0].zones.heading;
    expect(firstHeading.kind).toBe('text');
    if (firstHeading.kind !== 'text') throw new Error('Expected text zone');
    expect(firstHeading.value).toBe('Классический камень');
  });

  it('keeps the remaining legacy pages tied to active scenarios', () => {
    expect(createProject('commercial_offer').pages.some((page) => page.templateId === 'catalog_full_interior_slab_specs')).toBe(true);
    expect(createProject('moodboard_presentation').pages.some((page) => page.templateId === 'catalog_interior_two_large_tiles')).toBe(true);
  });
});
