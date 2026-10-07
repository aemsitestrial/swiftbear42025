import { buildLogo } from '../xe-logo/xe-logo.js';

export default function decorate(block) {
  // Rows: image (+ alt), the textContent_* group, then the logo_* group (variant, type).
  const logoRow = block.children[2];
  // const [variant, type] = [...(logoRow?.querySelectorAll('p') || [])]
  //   .map((p) => p.textContent.trim());
  // The logo settings are passed to xe-logo, so their row shouldn't render as text.
  // logoRow?.remove();

  // block.append(decorateLogo({ variant, type }));
  block.append(buildLogo(logoRow, { variant: 'inverse' }));
}
