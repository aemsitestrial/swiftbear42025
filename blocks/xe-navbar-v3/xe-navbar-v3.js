import { moveInstrumentation } from '../../scripts/scripts.js';

// AEM Sites root for this site (see paths.json). Page paths under it are published at the root.
const SITE_ROOT = '/content/2026/37/swiftbear42025';

// Resolve a selected AEM page into its page name and public URL, e.g.
// /content/2026/37/swiftbear42025/xe-banner.html -> { name: 'xe-banner', url: '/xe-banner' }.
const resolveSitePage = (href) => {
  let url;
  try {
    url = new URL(href, window.location.origin);
  } catch (e) {
    return null;
  }
  const path = url.pathname.replace(/\.html$/, '').replace(/\/+$/, '');
  const name = path.split('/').filter(Boolean).pop() || '';
  if (url.origin !== window.location.origin) return { name, url: url.href };
  const sitePath = path === SITE_ROOT || path.startsWith(`${SITE_ROOT}/`)
    ? path.slice(SITE_ROOT.length)
    : path;
  return { name, url: sitePath || '/' };
};

const QUERY_INDEX = '/query-index.json';
const INDEX_PAGE_SIZE = 500;
const MAX_LEVEL = 3;

const pageName = (path) => path.split('/').filter(Boolean).pop() || '';

// Load every published page path from the query index, following its pagination.
const fetchPagePaths = async (offset = 0) => {
  const resp = await fetch(`${QUERY_INDEX}?offset=${offset}&limit=${INDEX_PAGE_SIZE}`);
  if (!resp.ok) return [];
  const { data = [], total = 0 } = await resp.json();
  const paths = data
    .map(({ path }) => (path || '').replace(/\/+$/, ''))
    .filter(Boolean);
  const next = offset + data.length;
  return data.length && next < total ? paths.concat(await fetchPagePaths(next)) : paths;
};

// Build the nested list of pages authored directly under `parentPath`, down to MAX_LEVEL.
const buildChildList = (parentPath, pagePaths, level) => {
  if (level > MAX_LEVEL) return null;
  const prefix = `${parentPath}/`;
  const children = pagePaths
    .filter((path) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
    .sort((a, b) => pageName(a).localeCompare(pageName(b)));
  if (!children.length) return null;

  const list = document.createElement('ul');
  children.forEach((path) => {
    const li = document.createElement('li');
    const anchor = document.createElement('a');
    anchor.href = path;
    anchor.textContent = pageName(path);
    li.append(anchor);
    const subList = buildChildList(path, pagePaths, level + 1);
    if (subList) li.append(subList);
    list.append(li);
  });
  return list;
};

export default async function decorate(block) {
  const rows = [...block.children];
  const brand = rows[0];
  const brandLink = rows[1];
  const links = rows[2];

  const isEditor = !!block.closest('[data-aue-resource]');
  if (isEditor) {
    block.classList.add('xe-navbar-v3-editor');
  }

  // On AEM author the page lives under the site root, so keep the author link to stay navigable.
  const onAuthor = window.location.pathname.startsWith(`${SITE_ROOT}/`);

  // Top level items paired with the site path of their page, used to look up child pages.
  const sitePages = [];

  // The Site Link field renders as a single link (or a list of links if it becomes a multi-field
  // again). Resolve each selected page into its page name and site URL.
  if (links) {
    const cell = links.firstElementChild || links;
    let siteList = cell.querySelector('ul');
    if (!siteList) {
      siteList = document.createElement('ul');
      cell.querySelectorAll('a').forEach((anchor) => {
        const li = document.createElement('li');
        li.append(anchor);
        siteList.append(li);
      });
      cell.replaceChildren(siteList);
    }

    [...siteList.children].forEach((li) => {
      const anchor = li.querySelector('a');
      const page = anchor && resolveSitePage(anchor.getAttribute('href'));
      if (!page) {
        li.remove();
        return;
      }
      anchor.textContent = page.name || anchor.textContent;
      if (!onAuthor) anchor.setAttribute('href', page.url);
      li.replaceChildren(anchor);
      if (page.url.startsWith('/') && page.url !== '/') sitePages.push({ li, path: page.url });
    });
  }

  if (brand) {
    brand.classList.add('xe-navbar-brand');
    brand.dataset.blockName = 'xe-navbar-brand';
  }

  if (brandLink) {
    brandLink.classList.add('xe-navbar-brandLink');
    brandLink.dataset.blockName = 'xe-navbar-brandLink';

    const brandAnchor = brandLink.querySelector('a');
    const picture = brand?.querySelector('picture');

    if (brandAnchor && picture && brand) {
      brandAnchor.textContent = '';
      brandAnchor.classList.remove('button');

      // Move the picture into the existing anchor.
      brandAnchor.appendChild(picture);

      // Move the anchor into the brand container.
      brand.appendChild(brandAnchor);

      // Remove the div sibling before the anchor.
      const previousSibling = brandAnchor.previousElementSibling;
      if (previousSibling?.tagName === 'DIV') {
        previousSibling.remove();
      }

      // Remove the original brandLink container.
      brandLink.remove();
    }
  }

  if (links) {
    links.classList.add('xe-navbar-links');
    links.dataset.blockName = 'xe-navbar-links';

    const topList = links.querySelector('ul');

    // Subnavigation comes from the child pages authored under each site link. It is not shown in
    // the editor, and the query index is only available on the published site.
    if (topList && !isEditor && !onAuthor && sitePages.length) {
      let pagePaths = [];
      try {
        pagePaths = await fetchPagePaths();
      } catch (e) {
        pagePaths = [];
      }
      sitePages.forEach(({ li, path }) => {
        const subList = buildChildList(path, pagePaths, 2);
        if (subList) li.append(subList);
      });
    }

    links.querySelectorAll('a.button').forEach((a) => a.classList.remove('button'));
    links.querySelectorAll('p.button-container').forEach((p) => {
      p.replaceWith(...p.childNodes);
    });

    const getControl = (li) => li.querySelector(':scope > a, :scope > button');

    const annotate = (list, level) => {
      if (!list || level > 3) return;
      list.classList.add('xe-navbar-level', `xe-navbar-level-${level}`);
      [...list.children].forEach((li) => {
        if (li.tagName !== 'LI') return;
        const subList = li.querySelector(':scope > ul');
        if (subList) {
          li.classList.add('xe-navbar-has-children');

          let control = li.querySelector(':scope > a');
          if (control) {
            const href = control.getAttribute('href');
            const navigates = href && href !== '#' && !href.startsWith('#');
            if (!navigates) {
              const button = document.createElement('button');
              button.type = 'button';
              button.className = control.className;
              button.append(...control.childNodes);
              moveInstrumentation(control, button);
              control.replaceWith(button);
              control = button;
            }
          }

          // Add the chevron indicator to this parent's own control (not links in the sub list).
          if (control && !control.querySelector('.xe-navbar-chevron')) {
            const chevron = document.createElement('span');
            chevron.className = `xe-navbar-chevron xe-navbar-chevron-${level === 1 ? 'down' : 'right'}`;
            chevron.setAttribute('aria-hidden', 'true');
            control.appendChild(chevron);
          }

          annotate(subList, level + 1);
        }
      });
    };
    annotate(topList, 1);

    const closeMenu = (li) => {
      if (!li) return;
      li.classList.remove('xe-navbar-open');
      const control = getControl(li);
      if (control) control.setAttribute('aria-expanded', 'false');
      li.querySelectorAll('.xe-navbar-open').forEach((child) => {
        child.classList.remove('xe-navbar-open');
        const childControl = getControl(child);
        if (childControl) childControl.setAttribute('aria-expanded', 'false');
      });
    };

    const openMenu = (li) => {
      const control = getControl(li);
      [...li.parentElement.children].forEach((sibling) => {
        if (sibling !== li) closeMenu(sibling);
      });
      li.classList.add('xe-navbar-open');
      if (control) control.setAttribute('aria-expanded', 'true');
    };

    const setupToggle = (li) => {
      const control = getControl(li);
      if (!control) return;
      control.setAttribute('aria-haspopup', 'true');
      control.setAttribute('aria-expanded', 'false');

      const isButton = control.tagName === 'BUTTON';

      const toggle = (event) => {
        event.preventDefault();
        if (li.classList.contains('xe-navbar-open')) closeMenu(li);
        else openMenu(li);
      };

      control.addEventListener('click', toggle);
      if (!isButton) {
        control.addEventListener('keydown', (event) => {
          if (event.key === ' ') toggle(event);
        });
      }
    };

    links.querySelectorAll('.xe-navbar-has-children').forEach(setupToggle);

    // Arrow-key navigation (WAI-ARIA menu keyboard pattern). All links stay in the natural Tab
    const desktopMq = window.matchMedia('(min-width: 900px)');
    const listLevel = (list) => {
      if (list.classList.contains('xe-navbar-level-1')) return 1;
      if (list.classList.contains('xe-navbar-level-2')) return 2;
      if (list.classList.contains('xe-navbar-level-3')) return 3;
      return 0;
    };
    const itemsOf = (list) => [...list.children].filter((c) => c.tagName === 'LI');
    const focusAnchor = (li) => {
      const control = li && getControl(li);
      if (control) control.focus();
    };
    // Move focus to the item at `index`, wrapping around the ends of the list.
    const focusAt = (items, index) => focusAnchor(items[(index + items.length) % items.length]);
    const focusChild = (li, which) => {
      const sub = li.querySelector(':scope > ul');
      if (!sub) return;
      const children = itemsOf(sub);
      if (!children.length) return;
      const target = which === 'last' ? children[children.length - 1] : children[0];
      requestAnimationFrame(() => focusAnchor(target));
    };

    // The brand/logo link sits to the left of the navigation links in the desktop top row. Pull it
    // into the arrow-key sequence so Left/Right (and Home/End) move between the brand and the links
    // as one continuous row rather than the brand only being reachable by Tab.
    const brandAnchor = brand?.querySelector('a');
    const topAnchorSequence = () => {
      const seq = [];
      if (brandAnchor) seq.push(brandAnchor);
      if (topList) {
        itemsOf(topList).forEach((topLi) => {
          const control = getControl(topLi);
          if (control) seq.push(control);
        });
      }
      return seq;
    };
    // Sibling movement across a flat row of controls (anchors and toggle buttons), wrapping at the
    // ends. Returns true when it handled the key so the caller can stop. Used for the shared brand
    // + top-links row on desktop. `key` is passed explicitly so callers can remap (e.g. treat Down
    // as Right from the brand).
    const moveAcrossRow = (event, seq, key = event.key) => {
      const i = seq.indexOf(event.target.closest('a, button'));
      if (i < 0) return false;
      switch (key) {
        case 'ArrowRight':
          event.preventDefault();
          seq[(i + 1) % seq.length].focus();
          return true;
        case 'ArrowLeft':
          event.preventDefault();
          seq[(i - 1 + seq.length) % seq.length].focus();
          return true;
        case 'Home':
          event.preventDefault();
          seq[0].focus();
          return true;
        case 'End':
          event.preventDefault();
          seq[seq.length - 1].focus();
          return true;
        default:
          return false;
      }
    };

    // Listen on the whole block (not just the links list) so key presses on the brand link are
    // covered too.
    block.addEventListener('keydown', (event) => {
      const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
      if (!keys.includes(event.key)) return;

      const anchor = event.target.closest('a, button');
      if (!anchor || !block.contains(anchor)) return;

      const desktop = desktopMq.matches;

      if (brandAnchor && anchor === brandAnchor) {
        if (desktop) {
          const rowKey = { ArrowDown: 'ArrowRight', ArrowUp: 'ArrowLeft' }[event.key] || event.key;
          moveAcrossRow(event, topAnchorSequence(), rowKey);
        }
        return;
      }

      if (!links.contains(anchor)) return;
      const li = anchor.closest('li');
      const list = li?.parentElement;
      if (!list) return;
      const level = listLevel(list);
      if (!level) return;

      const items = itemsOf(list);
      const index = items.indexOf(li);
      const hasChildren = li.classList.contains('xe-navbar-has-children');
      // The top level is horizontal only on desktop; in the mobile drawer it stacks vertically.
      const topHorizontal = level === 1 && desktop;

      if (topHorizontal && moveAcrossRow(event, topAnchorSequence())) return;

      const nextKey = topHorizontal ? 'ArrowRight' : 'ArrowDown';
      const prevKey = topHorizontal ? 'ArrowLeft' : 'ArrowUp';
      const enterKey = topHorizontal ? 'ArrowDown' : 'ArrowRight';
      const closeKey = topHorizontal ? 'ArrowUp' : 'ArrowLeft';

      switch (event.key) {
        case nextKey:
          event.preventDefault();
          focusAt(items, index + 1);
          break;
        case prevKey:
          event.preventDefault();
          focusAt(items, index - 1);
          break;
        case 'Home':
          event.preventDefault();
          focusAt(items, 0);
          break;
        case 'End':
          event.preventDefault();
          focusAt(items, items.length - 1);
          break;
        case enterKey:
          if (hasChildren && li.classList.contains('xe-navbar-open')) {
            event.preventDefault();
            focusChild(li, 'first');
          }
          break;
        case closeKey:
          if (level > 1) {
            event.preventDefault();
            const parentLi = list.closest('li');
            if (parentLi) {
              closeMenu(parentLi);
              focusAnchor(parentLi);
            }
          } else if (li.classList.contains('xe-navbar-open')) {
            event.preventDefault();
            closeMenu(li);
          }
          break;
        default:
          break;
      }
    });

    document.addEventListener('click', (event) => {
      if (!links.contains(event.target)) {
        links.querySelectorAll('.xe-navbar-open').forEach(closeMenu);
      }
    });
    links.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        links.querySelectorAll('.xe-navbar-open').forEach(closeMenu);
      }
    });

    // Mobile / tablet navigation (screens under 900px). A hamburger button toggles the links list
    if (!isEditor) {
      links.id = links.id || 'xe-navbar-v3-drawer';

      const hamburger = document.createElement('button');
      hamburger.type = 'button';
      hamburger.className = 'xe-navbar-hamburger';
      hamburger.setAttribute('aria-label', 'Open navigation menu');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-controls', links.id);
      hamburger.innerHTML = '<span class="xe-navbar-hamburger-box" aria-hidden="true"><span class="xe-navbar-hamburger-inner"></span></span>';

      if (brand) brand.after(hamburger);
      else block.prepend(hamburger);

      const mobileMq = window.matchMedia('(max-width: 899px)');
      const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), '
        + 'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
      const getFocusable = () => [hamburger, ...links.querySelectorAll(FOCUSABLE)]
        .filter((el) => el.offsetParent !== null || el === document.activeElement);

      let lastFocused = null;
      const isOpen = () => block.classList.contains('xe-navbar-v3-drawer-open');
      let closeDrawer;

      const onKeydown = (event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          closeDrawer();
          return;
        }
        if (event.key !== 'Tab') return;
        const focusables = getFocusable();
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      };

      const openDrawer = () => {
        if (isOpen()) return;
        lastFocused = document.activeElement;
        block.classList.add('xe-navbar-v3-drawer-open');
        hamburger.setAttribute('aria-expanded', 'true');
        hamburger.setAttribute('aria-label', 'Close navigation menu');
        links.setAttribute('role', 'dialog');
        links.setAttribute('aria-modal', 'true');
        links.setAttribute('aria-label', 'Main navigation');
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKeydown, true);
        if (document.activeElement !== hamburger) hamburger.focus();
      };

      closeDrawer = ({ returnFocus = true } = {}) => {
        if (!isOpen()) return;
        block.classList.remove('xe-navbar-v3-drawer-open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', 'Open navigation menu');
        links.removeAttribute('role');
        links.removeAttribute('aria-modal');
        links.removeAttribute('aria-label');
        document.body.style.overflow = '';
        document.removeEventListener('keydown', onKeydown, true);
        links.querySelectorAll('.xe-navbar-open').forEach(closeMenu);
        if (returnFocus) hamburger.focus();
        else if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
      };

      hamburger.addEventListener('click', () => {
        if (isOpen()) closeDrawer();
        else openDrawer();
      });

      mobileMq.addEventListener('change', (event) => {
        if (!event.matches) closeDrawer({ returnFocus: false });
      });
    }
  }
}
