import { moveInstrumentation } from '../../scripts/scripts.js';
import { renderBlock } from '../../scripts/utils.js';

const QUERY_INDEX = '/query-index.json';
const INDEX_PAGE_SIZE = 500;
// Top level site links plus up to three levels of subnavigation. Authors pick how many levels to
// show in the Subnavigation Levels field; content authored before that field defaults to all.
const MAX_SUBNAV_LEVELS = 3;
const MAX_LEVEL = MAX_SUBNAV_LEVELS + 1;

const readSubnavLevels = (row) => {
  const levels = parseInt(row?.textContent.trim(), 10);
  if (Number.isNaN(levels)) return MAX_SUBNAV_LEVELS;
  return Math.min(Math.max(levels, 1), MAX_SUBNAV_LEVELS);
};

const pageName = (path) => path.split('/').filter(Boolean).pop() || '';

// Resolve a selected page link into its page name and path. Published links already carry the
// site path (paths.json is applied on publish), while author links keep their /content/... path,
const resolveSitePage = (href) => {
  let url;
  try {
    url = new URL(href, window.location.origin);
  } catch (e) {
    return null;
  }
  const path = url.pathname.replace(/\.html$/, '').replace(/\/+$/, '');
  return { name: pageName(path), path, sameOrigin: url.origin === window.location.origin };
};

// Read a page's title from the page itself (its og:title, falling back to <title>).
const fetchPageTitle = async (href) => {
  try {
    const resp = await fetch(href);
    if (!resp.ok) return '';
    const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
    const title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || doc.title;
    return (title || '').trim();
  } catch (e) {
    return '';
  }
};

// Load every published page (path and title) from the query index, following its pagination.
const fetchIndexPages = async (offset = 0) => {
  const resp = await fetch(`${QUERY_INDEX}?offset=${offset}&limit=${INDEX_PAGE_SIZE}`);
  if (!resp.ok) return [];
  const { data = [], total = 0 } = await resp.json();
  const pages = data
    .map(({ path, title }) => ({ path: (path || '').replace(/\/+$/, ''), title: (title || '').trim() }))
    .filter(({ path }) => path);
  const next = offset + data.length;
  return data.length && next < total ? pages.concat(await fetchIndexPages(next)) : pages;
};

// Build the nested list of pages authored directly under `parentPath`, down to `maxLevel`.
const buildChildList = (parentPath, pages, level, maxLevel) => {
  if (level > maxLevel) return null;
  const prefix = `${parentPath}/`;
  const children = pages
    .filter(({ path }) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
    .sort((a, b) => pageName(a.path).localeCompare(pageName(b.path)));
  if (!children.length) return null;

  const list = document.createElement('ul');
  children.forEach(({ path, title }) => {
    const li = document.createElement('li');
    const anchor = document.createElement('a');
    anchor.href = path;
    anchor.textContent = title || pageName(path);
    li.append(anchor);
    const subList = buildChildList(path, pages, level + 1, maxLevel);
    if (subList) li.append(subList);
    list.append(li);
  });
  return list;
};

// Fill in titles for pages the query index has no title for yet by reading them from the page.
const fillMissingTitles = (pages) => Promise.all(pages.map(async (page) => {
  if (page.title) return page;
  return { ...page, title: await fetchPageTitle(page.path) };
}));

export default async function decorate(block) {
  const rows = [...block.children];
  // Site Link and Subnavigation Levels are always the last two rows. Navbars rendered with the
  // older model still have Site Brand image and link rows ahead of them, which are no longer used.
  const [links, subnavRow] = rows.slice(-2);
  rows.slice(0, -2).forEach((row) => row.remove());
  const subnavLevels = readSubnavLevels(subnavRow);
  // The Subnavigation Levels row is a setting only, not navbar content.
  subnavRow?.remove();

  const isEditor = !!block.closest('[data-aue-resource]');
  if (isEditor) {
    block.classList.add('xe-navbar-v3-editor');
  }

  // The brand is not authored: it always renders the xe-logo block ahead of the links.
  const brand = document.createElement('div');
  brand.className = 'xe-navbar-brand';
  block.prepend(brand);
  const logoReady = renderBlock(brand, 'xe-logo', {
    variant: 'primary',
    size: 'md',
    type: 'lockup',
  });

  // AEM author serves pages from their repository path under /content.
  const onAuthor = window.location.pathname.startsWith('/content/');

  // Top level items paired with the site path of their page, used to look up child pages.
  const sitePages = [];

  // The Site Link field renders as a single link (or a list of links if it becomes a multi-field
  // again). Use each selected page's title as the link text.
  const titleRequests = [];
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
      li.replaceChildren(anchor);
      if (!page.sameOrigin) return;
      if (page.path) sitePages.push({ li, path: page.path });

      // Same-origin pages can be read directly for their title; the page name stays as fallback.
      titleRequests.push(fetchPageTitle(anchor.getAttribute('href')).then((title) => {
        if (title) anchor.textContent = title;
      }));
    });
  }
  await Promise.all([...titleRequests, logoReady]);

  if (links) {
    links.classList.add('xe-navbar-links');
    links.dataset.blockName = 'xe-navbar-links';

    const topList = links.querySelector('ul');

    // Subnavigation comes from the child pages authored under each site link. It is not shown in
    // the editor, and the query index is only available on the published site.
    if (topList && !isEditor && !onAuthor && sitePages.length) {
      let pages = [];
      try {
        // Only pages that can appear in the subnavigation (up to `subnavLevels` below a site link).
        pages = (await fetchIndexPages()).filter(({ path }) => sitePages.some((sitePage) => {
          const prefix = `${sitePage.path}/`;
          return path.startsWith(prefix) && path.slice(prefix.length).split('/').length <= subnavLevels;
        }));
        pages = await fillMissingTitles(pages);
      } catch (e) {
        pages = [];
      }
      sitePages.forEach(({ li, path }) => {
        const subList = buildChildList(path, pages, 2, subnavLevels + 1);
        if (subList) li.append(subList);
      });
    }

    links.querySelectorAll('a.button').forEach((a) => a.classList.remove('button'));
    links.querySelectorAll('p.button-container').forEach((p) => {
      p.replaceWith(...p.childNodes);
    });

    const getControl = (li) => li.querySelector(':scope > a, :scope > button');

    const annotate = (list, level) => {
      if (!list || level > MAX_LEVEL) return;
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

    const desktopMq = window.matchMedia('(min-width: 900px)');

    // Sub menus open to the right of their parent. With three levels of subnavigation they can run
    // past the right edge of the window, so open them towards the left instead when they don't fit.
    const placeFlyout = (li) => {
      const subList = li.querySelector(':scope > ul');
      if (!subList) return;
      subList.classList.remove('xe-navbar-flyout-left');
      if (!desktopMq.matches) return;
      // Once a sub menu opens towards the left, every level below it keeps opening to the left so
      // the menus don't zigzag back to the right.
      const parentOpensLeft = li.parentElement.classList.contains('xe-navbar-flyout-left');
      if (parentOpensLeft
        || subList.getBoundingClientRect().right > document.documentElement.clientWidth) {
        subList.classList.add('xe-navbar-flyout-left');
      }
    };

    const openMenu = (li) => {
      const control = getControl(li);
      [...li.parentElement.children].forEach((sibling) => {
        if (sibling !== li) closeMenu(sibling);
      });
      placeFlyout(li);
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
    const listLevel = (list) => {
      for (let level = 1; level <= MAX_LEVEL; level += 1) {
        if (list.classList.contains(`xe-navbar-level-${level}`)) return level;
      }
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

    links.addEventListener('keydown', (event) => {
      const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
      if (!keys.includes(event.key)) return;

      const anchor = event.target.closest('a, button');
      if (!anchor || !links.contains(anchor)) return;

      const desktop = desktopMq.matches;

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

      brand.after(hamburger);

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
