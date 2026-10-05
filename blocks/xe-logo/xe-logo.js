/*
 * XE Logo <xe-logo size="md" variant="primary" type="lockup"></xe-logo>
 */

import { moveInstrumentation } from '../../scripts/scripts.js';

// Key order matches the field (cell) order of the xe-logo model.
const DEFAULTS = { variant: 'primary', size: 'md', type: 'lockup' };

export default function decorate(block) {
  const cells = [...block.children];
  const xeLogo = document.createElement('xe-logo');
  Object.entries(DEFAULTS).forEach(([name, fallback], i) => {
    const value = cells[i]?.textContent.trim().toLowerCase();
    xeLogo.setAttribute(name, value || fallback);
  });
  // Keep the editor instrumentation so the Universal Editor can still select the logo.
  moveInstrumentation(block, xeLogo);
  block.replaceWith(xeLogo);
}
