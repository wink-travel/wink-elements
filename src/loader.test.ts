import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { load, _resetForTesting } from './loader.js';

describe('load()', () => {
  beforeEach(() => {
    _resetForTesting();
    document.head.replaceChildren();
    document.body.replaceChildren();
  });

  afterEach(() => {
    _resetForTesting();
  });

  it('injects stylesheet into <head>', () => {
    load({ clientId: 'test-id' });
    const link = document.head.querySelector('link[rel="stylesheet"]') as HTMLLinkElement;
    expect(link).not.toBeNull();
    expect(link.href).toBe('https://elements.wink.travel/styles.css');
  });

  it('injects module script into <body>', () => {
    load({ clientId: 'test-id' });
    const script = document.body.querySelector('script') as HTMLScriptElement;
    expect(script).not.toBeNull();
    expect(script.src).toBe('https://elements.wink.travel/elements.js');
    expect(script.type).toBe('module');
    expect(script.defer).toBe(true);
  });

  it('appends <wink-app-loader> with client-id', () => {
    load({ clientId: 'my-client-id' });
    const loader = document.body.querySelector('wink-app-loader');
    expect(loader).not.toBeNull();
    expect(loader?.getAttribute('client-id')).toBe('my-client-id');
  });

  it('does not set configuration-id when not provided', () => {
    load({ clientId: 'test-id' });
    const loader = document.body.querySelector('wink-app-loader');
    expect(loader?.hasAttribute('configuration-id')).toBe(false);
  });

  it('sets configuration-id when provided', () => {
    load({ clientId: 'test-id', configurationId: 'config-abc' });
    const loader = document.body.querySelector('wink-app-loader');
    expect(loader?.getAttribute('configuration-id')).toBe('config-abc');
  });

  it('uses custom CDN base URL when provided', () => {
    load({ clientId: 'test-id', cdnBaseUrl: 'https://staging-elements.wink.travel' });
    const link = document.head.querySelector('link[rel="stylesheet"]') as HTMLLinkElement;
    expect(link.href).toBe('https://staging-elements.wink.travel/styles.css');
    const script = document.body.querySelector('script') as HTMLScriptElement;
    expect(script.src).toBe('https://staging-elements.wink.travel/elements.js');
  });

  it('strips trailing slash from custom CDN URL', () => {
    load({ clientId: 'test-id', cdnBaseUrl: 'https://staging-elements.wink.travel/' });
    const link = document.head.querySelector('link[rel="stylesheet"]') as HTMLLinkElement;
    expect(link.href).toBe('https://staging-elements.wink.travel/styles.css');
  });

  it('is idempotent — calling load() twice only injects elements once', () => {
    load({ clientId: 'test-id' });
    load({ clientId: 'test-id' });
    expect(document.head.querySelectorAll('link[rel="stylesheet"]')).toHaveLength(1);
    expect(document.body.querySelectorAll('script')).toHaveLength(1);
    expect(document.body.querySelectorAll('wink-app-loader')).toHaveLength(1);
  });
});
