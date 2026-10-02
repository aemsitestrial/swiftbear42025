/*
 * XE Logo is a child block. It is only available inside parent blocks that list "xe-logo" in their
 * filter. The parent loads it through the standard block loader:
 *   row.dataset.blockName = 'xe-logo';
 *   await loadBlock(row);
 * which renders <xe-logo size="md" variant="primary" type="lockup"></xe-logo>.
 * The logo image itself is static and comes from xe-logo.css.
 */

import { moveInstrumentation } from '../../scripts/scripts.js';

const ATTRIBUTES = {
  variant: { values: ['primary', 'inverse'], fallback: 'primary' },
  size: { values: ['sm', 'md', 'lg'], fallback: 'md' },
  type: { values: ['lockup', 'mark'], fallback: 'lockup' },
};
// Cell order matches the field order of the xe-logo model.
const FIELDS = ['variant', 'size', 'type'];

const validate = (el, name) => {
  if (!ATTRIBUTES[name].values.includes(el.getAttribute(name))) {
    el.setAttribute(name, ATTRIBUTES[name].fallback);
  }
};

class XeLogo extends HTMLElement {
  static get observedAttributes() {
    return FIELDS;
  }

  connectedCallback() {
    FIELDS.forEach((name) => validate(this, name));
    this.setAttribute('role', 'img');
    if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', 'XE logo');
  }

  attributeChangedCallback(name) {
    if (this.isConnected) validate(this, name);
  }
}

if (!customElements.get('xe-logo')) customElements.define('xe-logo', XeLogo);

export default function decorate(block) {
  const cells = [...block.children];
  const logo = document.createElement('xe-logo');
  FIELDS.forEach((name, i) => {
    const value = cells[i]?.textContent.trim().toLowerCase();
    logo.setAttribute(name, value || ATTRIBUTES[name].fallback);
  });
  // Keep the editor instrumentation so the Universal Editor can still select the logo.
  moveInstrumentation(block, logo);
  block.replaceWith(logo);
}
