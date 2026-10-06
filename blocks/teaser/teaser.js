import { decorateLogo } from '../xe-logo/xe-logo.js';

export default async function decorate(block) {
  // Rows: image (+ alt), the textContent_* group, then the logo_* group (variant, type).
  const [, , logoRow] = block.children;
  const [logoVariant, logoType] = [...(logoRow?.querySelectorAll('p') || [])]
    .map((p) => p.textContent.trim());
  const decoratedLogo = decorateLogo(logoRow, {
    variant: logoVariant || 'primary',
    type: logoType || 'lockup'
  });
  // The logo settings are passed to xe-logo, so their row shouldn't render as text.
  logoRow?.remove();

  block.append(decoratedLogo);
}
