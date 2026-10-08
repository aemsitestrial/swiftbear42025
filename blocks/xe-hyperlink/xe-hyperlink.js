/*
 * XE Hyperlink
 * <xe-hyperlink href="/path" trailing-icon link-type="auto" target="_blank">Text</xe-hyperlink>
 */

import { getBlockProps } from '../../scripts/utils.js';

// Key order matches the field (cell) order of the xe-hyperlink model.
const DEFAULTS = {
  text: '', href: '', trailingIcon: 'false', linkType: '', target: '',
};

export function buildHyperlink(props = {}) {
  const {
    text, href, trailingIcon, linkType, target,
  } = { ...DEFAULTS, ...props };
  const xeHyperlink = document.createElement('xe-hyperlink');
  xeHyperlink.setAttribute('href', href);
  if (String(trailingIcon).toLowerCase() === 'true') xeHyperlink.setAttribute('trailing-icon', '');
  xeHyperlink.setAttribute('link-type', linkType.toLowerCase());
  xeHyperlink.setAttribute('target', target.toLowerCase());
  xeHyperlink.textContent = text;
  return xeHyperlink;
}

export default function decorate(block, props = {}) {
  // The authored href is a link, so read where it points rather than its text.
  const href = block.querySelector('a')?.getAttribute('href');
  const blockProps = getBlockProps(block, DEFAULTS, props);
  if (href && !Object.hasOwn(props, 'href')) blockProps.href = href;
  block.replaceChildren(buildHyperlink(blockProps));
}
