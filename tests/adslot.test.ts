import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { AdSlot } from '../apps/web/src/components/AdSlot';

describe('AdSlot Component Isolation and Architecture Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('renders nothing when NEXT_PUBLIC_ADS_ENABLED is false (default production state)', () => {
    process.env.NEXT_PUBLIC_ADS_ENABLED = 'false';
    process.env.NEXT_PUBLIC_SHOW_AD_PLACEHOLDERS = 'false';

    const html = renderToString(
      React.createElement(AdSlot, { slotId: 'homepage-primary', format: 'horizontal' })
    );

    expect(html).toBe('');
  });

  it('renders layout placeholder when NEXT_PUBLIC_SHOW_AD_PLACEHOLDERS is true', () => {
    process.env.NEXT_PUBLIC_ADS_ENABLED = 'false';
    process.env.NEXT_PUBLIC_SHOW_AD_PLACEHOLDERS = 'true';

    const html = renderToString(
      React.createElement(AdSlot, { slotId: 'homepage-primary', format: 'horizontal', minHeight: 90 })
    );

    expect(html).toContain('homepage-primary');
    expect(html).toContain('Advertisement');
    expect(html).toContain('PREVIEW');
    expect(html).toContain('min-height:90px');
  });

  it('renders adsbygoogle container with correct data attributes when ads are enabled', () => {
    process.env.NEXT_PUBLIC_ADS_ENABLED = 'true';
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID = 'ca-pub-1234567890123456';

    const html = renderToString(
      React.createElement(AdSlot, {
        slotId: 'tool-result-ad',
        format: 'responsive',
        minHeight: 100,
        label: 'Sponsored'
      })
    );

    expect(html).toContain('adsbygoogle');
    expect(html).toContain('data-ad-slot="tool-result-ad"');
    expect(html).toContain('data-ad-client="ca-pub-1234567890123456"');
    expect(html).toContain('data-ad-format="responsive"');
    expect(html).toContain('Sponsored');
    expect(html).toContain('min-height:100px');
  });

  it('preserves layout stability by enforcing custom min-height and class names', () => {
    process.env.NEXT_PUBLIC_ADS_ENABLED = 'true';
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID = 'ca-pub-999';

    const html = renderToString(
      React.createElement(AdSlot, {
        slotId: 'footer-ad',
        format: 'horizontal',
        minHeight: 120,
        className: 'my-custom-class'
      })
    );

    expect(html).toContain('min-height:120px');
    expect(html).toContain('my-custom-class');
  });
});
