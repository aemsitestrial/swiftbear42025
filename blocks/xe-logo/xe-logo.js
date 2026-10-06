/*
 * XE Logo <xe-logo size="md" variant="primary" type="lockup"></xe-logo>
 */

import { moveInstrumentation } from '../../scripts/scripts.js';
import { getBlockProps } from '../../scripts/utils.js';

// Key order matches the field (cell) order of the xe-logo model.
const DEFAULTS = { variant: 'primary', size: 'md', type: 'lockup' };

export default function decorateLogo(block, props = DEFAULTS) {
  const xeLogo = document.createElement('xe-logo');
  Object.entries(getBlockProps(block, props)).forEach(([name, value]) => {
    xeLogo.setAttribute(name, String(value).toLowerCase());
  });
  // Keep the editor instrumentation so the Universal Editor can still select the logo.
  moveInstrumentation(block, xeLogo);
  block.replaceWith(xeLogo);
}
