/*
 * XE Logo is a child block. It is only available inside parent blocks that list "xe-logo" in their
 * filter. The parent loads it through the standard block loader:
 *   row.dataset.blockName = 'xe-logo';
 *   await loadBlock(row);
 * which renders <xe-logo size="md" variant="primary" type="lockup"></xe-logo> until the
 * properties are set through authoring.
 * The logo image itself is static and comes from xe-logo.css.
 */

import { moveInstrumentation } from '../../scripts/scripts.js';

// Key order matches the field (cell) order of the xe-logo model.
const DEFAULTS = { variant: 'primary', size: 'md', type: 'lockup' };

export default function decorate(block) {
  const cells = [...block.children];
  const logo = document.createElement('xe-logo');
  Object.entries(DEFAULTS).forEach(([name, fallback], i) => {
    const value = cells[i]?.textContent.trim().toLowerCase();
    logo.setAttribute(name, value || fallback);
  });
  logo.setAttribute('role', 'img');
  logo.setAttribute('aria-label', 'XE logo');
  // Keep the editor instrumentation so the Universal Editor can still select the logo.
  moveInstrumentation(block, logo);
  block.replaceWith(logo);
}
