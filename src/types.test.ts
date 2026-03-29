import { describe, it, expect, expectTypeOf } from 'vitest';
import type {
  WinkLayout,
  WinkSortOrder,
  WinkAppLoaderAttributes,
  WinkContentLoaderAttributes,
  WinkItineraryPickerAttributes,
} from './types.js';

describe('type definitions', () => {
  it('WinkLayout includes all expected values', () => {
    const layouts: WinkLayout[] = [
      'AD_BANNER', 'MAP', 'HOTEL', 'GUEST_ROOM', 'MEETING_ROOM',
      'SPA', 'RESTAURANT', 'ACTIVITY', 'ATTRACTION', 'PLACE',
      'ADD_ON', 'LIST', 'SEARCH', 'RANKED',
    ];
    expect(layouts).toHaveLength(14);
  });

  it('WinkSortOrder includes all expected values', () => {
    const sorts: WinkSortOrder[] = [
      'MEMBER', 'PRICE_LOW_TO_HIGH', 'PRICE_HIGH_TO_LOW', 'PRICE',
      'POPULARITY', 'ECO', 'EXPERIENCE', 'PERK', 'LOYALTY', 'PACKAGE',
    ];
    expect(sorts).toHaveLength(10);
  });

  it('WinkAppLoaderAttributes requires client-id', () => {
    expectTypeOf<WinkAppLoaderAttributes>().toHaveProperty('client-id');
    const attrs: WinkAppLoaderAttributes = { 'client-id': 'test' };
    expect(attrs['client-id']).toBe('test');
  });

  it('WinkContentLoaderAttributes requires layout and id', () => {
    const attrs: WinkContentLoaderAttributes = { layout: 'HOTEL', id: 'abc123' };
    expect(attrs.layout).toBe('HOTEL');
    expect(attrs.id).toBe('abc123');
  });

  it('WinkItineraryPickerAttributes allows optional promo-code', () => {
    const withPromo: WinkItineraryPickerAttributes = { 'promo-code': 'SUMMER10' };
    const withoutPromo: WinkItineraryPickerAttributes = {};
    expect(withPromo['promo-code']).toBe('SUMMER10');
    expect(withoutPromo['promo-code']).toBeUndefined();
  });
});
