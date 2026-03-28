/**
 * Attribute types for all Wink custom elements.
 * These map directly to the HTML attributes accepted by each element.
 */

export type WinkLayout =
  | 'AD_BANNER'
  | 'MAP'
  | 'HOTEL'
  | 'GUEST_ROOM'
  | 'MEETING_ROOM'
  | 'SPA'
  | 'RESTAURANT'
  | 'ACTIVITY'
  | 'ATTRACTION'
  | 'PLACE'
  | 'ADD_ON'
  | 'LIST'
  | 'SEARCH'
  | 'RANKED';

export type WinkSortOrder =
  | 'MEMBER'
  | 'PRICE_LOW_TO_HIGH'
  | 'PRICE_HIGH_TO_LOW'
  | 'PRICE'
  | 'POPULARITY'
  | 'ECO'
  | 'EXPERIENCE'
  | 'PERK'
  | 'LOYALTY'
  | 'PACKAGE';

/** <wink-app-loader> — bootstraps the Wink runtime. Include once per page. */
export interface WinkAppLoaderAttributes {
  /** Your OAuth2 client ID from https://studio.wink.travel */
  'client-id': string;
  /** Optional customization/configuration ID */
  'configuration-id'?: string;
}

/** <wink-content-loader> — displays inventory cards, grids, or maps. */
export interface WinkContentLoaderAttributes {
  /** Layout type to render */
  layout: WinkLayout;
  /** Inventory or layout ID from Wink Studio */
  id: string;
  /** Sort order — only used when layout is RANKED and id is empty */
  sort?: WinkSortOrder;
  /** Reduce CPU usage for low-power devices */
  'optimize-cpu-usage'?: 'true' | 'false';
}

/** <wink-lookup> — search bar for destinations and hotels. */
export type WinkLookupAttributes = Record<string, never>;

/** <wink-search-button> — icon button that opens the itinerary picker modal. */
export type WinkSearchButtonAttributes = Record<string, never>;

/** <wink-account-button> — sign-in / user account button. */
export type WinkAccountButtonAttributes = Record<string, never>;

/** <wink-itinerary-button> — shows current itinerary and opens the picker modal. */
export type WinkItineraryButtonAttributes = Record<string, never>;

/** <wink-shopping-cart-button> — shows the cart and opens the cart modal. */
export type WinkShoppingCartButtonAttributes = Record<string, never>;

/** <wink-itinerary-picker> — inline itinerary form with promo code support. */
export interface WinkItineraryPickerAttributes {
  /** Pre-fill a promo code */
  'promo-code'?: string;
}
