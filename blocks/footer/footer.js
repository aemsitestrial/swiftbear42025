import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';

  // if the current page IS the footer fragment being edited, hide the footer block so the
  // author isn't confused by seeing the same content duplicated (once here, once as the
  // editable page content).
  const currentPath = window.location.pathname.replace(/\.html$/, '');
  if (currentPath === footerPath.replace(/\.html$/, '')) {
    const footer = block.closest('footer') || block;
    footer.style.display = 'none';
    return;
  }

  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);
}
