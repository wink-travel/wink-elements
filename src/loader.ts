export interface WinkLoadOptions {
  /** App client ID from https://my.wink.travel */
  clientId: string;
  /** Customization ID from https://my.wink.travel*/
  configurationId?: string;
  /**
   * Base URL of the Wink elements CDN.
   * Defaults to the production CDN: https://elements.wink.travel
   */
  cdnBaseUrl?: string;
}

const DEFAULT_CDN = 'https://elements.wink.travel';

/** Tracks whether we've already injected the Wink scripts into this page. */
let loaded = false;

/**
 * Injects the Wink CDN stylesheet and script into the document, then appends
 * the `<wink-app-loader>` element to the body. Safe to call multiple times —
 * subsequent calls are no-ops.
 *
 * @example
 * ```ts
 * import { load } from '@wink/elements';
 * load({ clientId: 'my-client-id' });
 * ```
 */
export function load(options: WinkLoadOptions): void {
  if (loaded) return;
  loaded = true;

  const { clientId, configurationId, cdnBaseUrl = DEFAULT_CDN } = options;
  const base = cdnBaseUrl.replace(/\/$/, '');

  injectStylesheet(`${base}/styles.css`);
  injectScript(`${base}/elements.js`);
  appendAppLoader(clientId, configurationId);
}

/** Resets the loaded flag — intended for testing only. */
export function _resetForTesting(): void {
  loaded = false;
}

function injectStylesheet(href: string): void {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function injectScript(src: string): void {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const script = document.createElement('script');
  script.src = src;
  script.type = 'module';
  script.defer = true;
  document.body.appendChild(script);
}

function appendAppLoader(clientId: string, configurationId?: string): void {
  if (document.querySelector('wink-app-loader')) return;
  const loader = document.createElement('wink-app-loader');
  loader.setAttribute('client-id', clientId);
  if (configurationId) {
    loader.setAttribute('configuration-id', configurationId);
  }
  document.body.appendChild(loader);
}
