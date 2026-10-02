/*
 * XE Logo is a child item, not a standalone block. Any parent block can accept it by adding
 * "xe-logo" to its filter. Each logo item row authored inside a block is replaced with:
 *   <xe-logo size="md" variant="primary" type="lockup"></xe-logo>
 * The logo image itself is static and comes from xe-logo.css.
 */

import { loadCSS } from '../../scripts/aem.js';

const ATTRIBUTES = {
  variant: { values: ['primary', 'inverse'], fallback: 'primary' },
  size: { values: ['sm', 'md', 'lg'], fallback: 'md' },
  type: { values: ['lockup', 'mark'], fallback: 'lockup' },
};
// Row cell order matches the field order of the xe-logo model.
const FIELDS = ['variant', 'size', 'type'];

class XeLogo extends HTMLElement {
  static get observedAttributes() {
    return FIELDS;
  }

  connectedCallback() {
    FIELDS.forEach((name) => {
      if (!ATTRIBUTES[name].values.includes(this.getAttribute(name))) {
        this.setAttribute(name, ATTRIBUTES[name].fallback);
      }
    });
    this.setAttribute('role', 'img');
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'XE logo');
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (this.isConnected && !ATTRIBUTES[name].values.includes(newValue)) {
      this.setAttribute(name, ATTRIBUTES[name].fallback);
    }
  }
}

if (!customElements.get('xe-logo')) customElements.define('xe-logo', XeLogo);

const readCells = (row) => [...row.children].map((cell) => cell.textContent.trim().toLowerCase());

/**
 * A row is an xe-logo item when the editor tags it with the xe-logo model, or (on published
 * pages, where that tag is absent) when its three cells hold valid variant, size and type values.
 */
function isXeLogoRow(row) {
  if (row.dataset.aueModel) return row.dataset.aueModel === 'xe-logo';
  if (row.children.length !== FIELDS.length) return false;
  if ([...row.children].some((cell) => cell.querySelector(':scope > :not(p)'))) return false;
  const values = readCells(row);
  return FIELDS.every((name, i) => ATTRIBUTES[name].values.includes(values[i]));
}

/**
 * Replaces every xe-logo item row inside the blocks of a container with an <xe-logo> element.
 * Runs before the parent block decorates, so parent blocks see <xe-logo> as a direct child.
 * @param {Element} container The element containing the blocks
 */
export default function decorateXeLogos(container) {
  const rows = [...container.querySelectorAll('.block > div')].filter(isXeLogoRow);
  if (!rows.length) return;

  rows.forEach((row) => {
    const values = readCells(row);
    const logo = document.createElement('xe-logo');
    FIELDS.forEach((name, i) => logo.setAttribute(name, values[i] || ATTRIBUTES[name].fallback));
    // Keep the editor instrumentation so the Universal Editor can still select the item.
    [...row.attributes]
      .filter(({ name }) => name.startsWith('data-aue-'))
      .forEach(({ name, value }) => logo.setAttribute(name, value));
    row.replaceWith(logo);
  });

  loadCSS(`${window.hlx.codeBasePath}/blocks/xe-logo/xe-logo.css`);
}
