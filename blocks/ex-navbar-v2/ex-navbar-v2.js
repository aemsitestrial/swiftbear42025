import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const rows = [...block.children];
  const brand = rows[0];
  const brandLink = rows[1];
  const links = rows[2];
  const subnavRows = rows.slice(3);

  const isEditor = !!block.closest('[data-aue-resource]');
  if (isEditor) {
    block.classList.add('ex-navbar-v2-editor');
  }

  if (brand) {
    brand.classList.add('ex-navbar-brand');
    brand.dataset.blockName = 'ex-navbar-brand';
  }

  if (brandLink) {
    brandLink.classList.add('ex-navbar-brandLink');
    brandLink.dataset.blockName = 'ex-navbar-brandLink';

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
    links.classList.add('ex-navbar-links');
    links.dataset.blockName = 'ex-navbar-links';

    const topList = links.querySelector('ul');
    if (topList && !isEditor) {
      const topItems = [...topList.children].filter((li) => li.tagName === 'LI');
      const normalize = (text) => (text || '').trim().toLowerCase();

      subnavRows.forEach((row) => {
        const subList = row.querySelector('ul');
        if (!subList) return;

        const labelSource = row.cloneNode(true);
        labelSource.querySelectorAll('ul').forEach((ul) => ul.remove());
        const label = normalize(labelSource.textContent);

        if (!label) {
          row.remove();
          return;
        }

        // Map strictly by label: attach to the top level link whose text matches.
        const targetItem = topItems.find((li) => {
          const anchor = li.querySelector(':scope > a');
          return normalize(anchor?.textContent) === label;
        });

        if (!targetItem) {
          row.remove();
          return;
        }

        // Carry the editor instrumentation from the subnav row onto the list that survives so the
        // Universal Editor keeps tracking this child block. Without this the child block loses its
        // data-aue-* handle when the row is removed and disappears from the editor.
        moveInstrumentation(row, subList);
        targetItem.appendChild(subList);

        row.remove();
      });
    }

    links.querySelectorAll('a.button').forEach((a) => a.classList.remove('button'));
    links.querySelectorAll('p.button-container').forEach((p) => {
      p.replaceWith(...p.childNodes);
    });

    const getControl = (li) => li.querySelector(':scope > a, :scope > button');

    const annotate = (list, level) => {
      if (!list || level > 3) return;
      list.classList.add('ex-navbar-level', `ex-navbar-level-${level}`);
      [...list.children].forEach((li) => {
        if (li.tagName !== 'LI') return;
        const subList = li.querySelector(':scope > ul');
        if (subList) {
          li.classList.add('ex-navbar-has-children');

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
          if (control && !control.querySelector('.ex-navbar-chevron')) {
            const chevron = document.createElement('span');
            chevron.className = `ex-navbar-chevron ex-navbar-chevron-${level === 1 ? 'down' : 'right'}`;
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
      li.classList.remove('ex-navbar-open');
      const control = getControl(li);
      if (control) control.setAttribute('aria-expanded', 'false');
      li.querySelectorAll('.ex-navbar-open').forEach((child) => {
        child.classList.remove('ex-navbar-open');
        const childControl = getControl(child);
        if (childControl) childControl.setAttribute('aria-expanded', 'false');
      });
    };

    const openMenu = (li) => {
      const control = getControl(li);
      [...li.parentElement.children].forEach((sibling) => {
        if (sibling !== li) closeMenu(sibling);
      });
      li.classList.add('ex-navbar-open');
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
        if (li.classList.contains('ex-navbar-open')) closeMenu(li);
        else openMenu(li);
      };

      control.addEventListener('click', toggle);
      if (!isButton) {
        control.addEventListener('keydown', (event) => {
          if (event.key === ' ') toggle(event);
        });
      }
    };

    links.querySelectorAll('.ex-navbar-has-children').forEach(setupToggle);

    // Arrow-key navigation (WAI-ARIA menu keyboard pattern). All links stay in the natural Tab
    const desktopMq = window.matchMedia('(min-width: 900px)');
    const listLevel = (list) => {
      if (list.classList.contains('ex-navbar-level-1')) return 1;
      if (list.classList.contains('ex-navbar-level-2')) return 2;
      if (list.classList.contains('ex-navbar-level-3')) return 3;
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
      const hasChildren = li.classList.contains('ex-navbar-has-children');
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
          if (hasChildren && li.classList.contains('ex-navbar-open')) {
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
          } else if (li.classList.contains('ex-navbar-open')) {
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
        links.querySelectorAll('.ex-navbar-open').forEach(closeMenu);
      }
    });
    links.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        links.querySelectorAll('.ex-navbar-open').forEach(closeMenu);
      }
    });

    // Mobile / tablet navigation (screens under 900px). A hamburger button toggles the links list
    if (!isEditor) {
      links.id = links.id || 'ex-navbar-v2-drawer';

      const hamburger = document.createElement('button');
      hamburger.type = 'button';
      hamburger.className = 'ex-navbar-hamburger';
      hamburger.setAttribute('aria-label', 'Open navigation menu');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-controls', links.id);
      hamburger.innerHTML = '<span class="ex-navbar-hamburger-box" aria-hidden="true"><span class="ex-navbar-hamburger-inner"></span></span>';

      if (brand) brand.after(hamburger);
      else block.prepend(hamburger);

      const mobileMq = window.matchMedia('(max-width: 899px)');
      const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), '
        + 'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
      const getFocusable = () => [hamburger, ...links.querySelectorAll(FOCUSABLE)]
        .filter((el) => el.offsetParent !== null || el === document.activeElement);

      let lastFocused = null;
      const isOpen = () => block.classList.contains('ex-navbar-v2-drawer-open');

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
        block.classList.add('ex-navbar-v2-drawer-open');
        hamburger.setAttribute('aria-expanded', 'true');
        hamburger.setAttribute('aria-label', 'Close navigation menu');
        links.setAttribute('role', 'dialog');
        links.setAttribute('aria-modal', 'true');
        links.setAttribute('aria-label', 'Main navigation');
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKeydown, true);
        const firstLink = links.querySelector(FOCUSABLE);
        if (firstLink) requestAnimationFrame(() => firstLink.focus());
      };

      const closeDrawer = ({ returnFocus = true } = {}) => {
        if (!isOpen()) return;
        block.classList.remove('ex-navbar-v2-drawer-open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', 'Open navigation menu');
        links.removeAttribute('role');
        links.removeAttribute('aria-modal');
        links.removeAttribute('aria-label');
        document.body.style.overflow = '';
        document.removeEventListener('keydown', onKeydown, true);
        links.querySelectorAll('.ex-navbar-open').forEach(closeMenu);
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

    if (isEditor) {
      // Keep each subnav as its own full-width row in the editor. Tag the rows and clean up the
      // button treatment the core decorateButtons pass applies to their links.
      subnavRows.forEach((row) => {
        row.classList.add('ex-navbar-subnav-row');
        row.dataset.blockName = 'ex-navbar-subnav';
        row.querySelectorAll('a.button').forEach((a) => a.classList.remove('button'));
        row.querySelectorAll('p.button-container').forEach((p) => {
          p.replaceWith(...p.childNodes);
        });
      });
    }
  }
}
