/*
 * XE Logo <xe-logo size="md" variant="primary" type="lockup"></xe-logo>
 */

import { loadCSS } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { getBlockProps } from '../../scripts/utils.js';

// Key order matches the field (cell) order of the xe-logo model.
const DEFAULTS = { variant: 'primary', size: 'md', type: 'lockup' };

export function decorateLogo(props = {}) {
  loadCSS(`${window.hlx.codeBasePath}/blocks/xe-logo/xe-logo.css`).catch(() => {});

  const xeLogo = document.createElement('xe-logo');
  Object.entries(DEFAULTS).forEach(([name, fallback]) => {
    xeLogo.setAttribute(name, String(props[name] || fallback).toLowerCase());
  });
  return xeLogo;
}

export default function decorate(block) {
  block.replaceChildren(decorateLogo(getBlockProps(block, DEFAULTS)));
}
