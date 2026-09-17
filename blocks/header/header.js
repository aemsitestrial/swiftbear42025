import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/navbar-v2';
  const fragment = await loadFragment(navPath);

  // if the current page IS the nav fragment being edited/viewed, hide the header block so the
  // author isn't confused by seeing the same content duplicated (once here, once as the
  // editable page content). Compare on the last path segment (basename) because the Universal
  // Editor loads the page at its full content path (e.g. /content/.../navbar-v2) while the fragment
  // path is just /navbar-v2, so a full-path equality check would never match in the editor.
  const basename = (p) => p.replace(/\.html$/, '').replace(/\/$/, '').split('/').pop();
  if (basename(window.location.pathname) === basename(navPath)) {
    const header = block.closest('header') || block;
    header.style.display = 'none';
    return;
  }

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);
  block.append(nav);
}
