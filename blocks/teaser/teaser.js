import { renderBlock } from '../../scripts/utils.js';

export default async function decorate(block) {
  // Rows: image (+ alt), the textContent_* group, then the logo_* group (variant, type).
  const [, , logoRow] = block.children;
  const [logoVariant, logoType] = [...(logoRow?.querySelectorAll('p') || [])]
    .map((p) => p.textContent.trim());
  // The logo settings are passed to xe-logo, so their row shouldn't render as text.
  logoRow?.remove();

  await renderBlock(block, 'xe-logo', {
    variant: logoVariant || 'primary',
    size: 'md',
    type: logoType || 'lockup',
  }, 'afterbegin');
}
