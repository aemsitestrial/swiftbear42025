/*
 * XE Logo <xe-logo size="md" variant="primary" type="lockup"></xe-logo>
 */

import { moveInstrumentation } from '../../scripts/scripts.js';
import { getBlockProps } from '../../scripts/utils.js';

// Key order matches the field (cell) order of the xe-logo model.
const DEFAULTS = { variant: 'primary', size: 'md', type: 'lockup' };

export function decorateLogo(props = {}) {
  const xeLogo = document.createElement('xe-logo');
  Object.entries(DEFAULTS).forEach(([name, fallback]) => {
    xeLogo.setAttribute(name, String(props[name] || fallback).toLowerCase());
  });
  return xeLogo;
}

export default function decorate(block) {
  const xeLogo = decorateLogo(getBlockProps(block, DEFAULTS));
  // Keep the editor instrumentation so the Universal Editor can still select the logo.
  moveInstrumentation(block, xeLogo);
  block.replaceWith(xeLogo);
}
