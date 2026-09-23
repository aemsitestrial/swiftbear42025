import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const rows = [...block.children];
  const brand = rows[0];
  const brandLink = rows[1];
  const links = rows[2];
  // Every row after the main links list is an ex-navbar-subnav child block. Each one maps to the
  // top level link whose text matches its authored "Parent Link Label" and becomes that link's
  // sub navigation.
  const subnavRows = rows.slice(3);

  // Editor context is per-block, not per-page. This block only carries the Universal Editor's
  // data-aue-* instrumentation when it is the editable page content (i.e. the navbar-v2 fragment
  // page referenced by header.js as the navPath). When the same navbar is injected read-only into
  // other pages by header.js it is fetched plain HTML with no instrumentation. We mark the block
  // with a class so the editor-only CSS targets this exact instance instead of relying on a broad
  // `[data-aue-resource]` ancestor selector, which would leak editor styling onto the header-loaded
  // navbar whenever any other page is opened in the editor.
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
      // Remove the text and button class from the existing anchor.
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

    // In the Universal Editor the block is instrumented with data-aue-* attributes. There we keep
    // each ex-navbar-subnav as its own default full-width row (see CSS) so authors can select and
    // edit each one directly; the sub navigation is only injected into its parent link on the
    // published side. `isEditor` is computed once above from this block's own instrumentation.
    const topList = links.querySelector('ul');
    if (topList && !isEditor) {
      const topItems = [...topList.children].filter((li) => li.tagName === 'LI');
      const normalize = (text) => (text || '').trim().toLowerCase();

      // Match each ex-navbar-subnav block to a top level link by label. The subnav authors a
      // "Parent Link Label" holding the exact text of the top level link it belongs to; we attach
      // the subnav's list to the item whose link text matches. The subnav's list becomes that
      // link's sub navigation, and any list nested within it becomes a third level, giving up to
      // 3 levels of navigation.
      subnavRows.forEach((row) => {
        const subList = row.querySelector('ul');
        // A freshly inserted subnav has no list yet. Leave the row untouched so the Universal
        // Editor keeps its data-aue-* handle and the author can still select and populate it.
        if (!subList) return;

        // The parent label is the row's text outside of the sub navigation list.
        const labelSource = row.cloneNode(true);
        labelSource.querySelectorAll('ul').forEach((ul) => ul.remove());
        const label = normalize(labelSource.textContent);

        // With no Parent Link Label authored there is nothing to map this subnav to, so it should
        // not be rendered. Remove the row entirely (published side has no editor instrumentation
        // to preserve).
        if (!label) {
          row.remove();
          return;
        }

        // Map strictly by label: attach to the top level link whose text matches.
        const targetItem = topItems.find((li) => {
          const anchor = li.querySelector(':scope > a');
          return normalize(anchor?.textContent) === label;
        });

        // No top level link matches this label. Drop the subnav rather than render it detached
        // from any parent.
        if (!targetItem) {
          row.remove();
          return;
        }

        // Carry the editor instrumentation from the subnav row onto the list that survives so the
        // Universal Editor keeps tracking this child block. Without this the child block loses its
        // data-aue-* handle when the row is removed and disappears from the editor.
        moveInstrumentation(row, subList);
        targetItem.appendChild(subList);

        // The row wrapper is now empty; remove it since its instrumentation lives on the list.
        row.remove();
      });
    }

    // Remove the button treatment applied by the core decorateButtons pass. Parent list items
    // that also contain a sub-menu get their anchor wrapped in a <p class="button-container">
    // with the anchor marked as a `button`; that markup is not appropriate for navigation.
    links.querySelectorAll('a.button').forEach((a) => a.classList.remove('button'));
    links.querySelectorAll('p.button-container').forEach((p) => {
      // Unwrap the paragraph, leaving its contents (the anchor) directly in the <li>.
      p.replaceWith(...p.childNodes);
    });

    // Annotate each list with its nesting level (up to 3) and flag items that have a sub-menu.
    // For accessibility the nested navigation is NOT revealed on hover; it only opens when the
    // author clicks or presses Enter on the parent link (see setupToggle below). A chevron is
    // added to each parent link to signal that a sub navigation exists: a down chevron on the top
    // level links, and a right chevron on deeper levels whose fly-out opens to the side.
    const annotate = (list, level) => {
      if (!list || level > 3) return;
      list.classList.add('ex-navbar-level', `ex-navbar-level-${level}`);
      [...list.children].forEach((li) => {
        if (li.tagName !== 'LI') return;
        const subList = li.querySelector(':scope > ul');
        if (subList) {
          li.classList.add('ex-navbar-has-children');

          // Add the chevron indicator to this parent's own link (not links in the sub list).
          const anchor = li.querySelector(':scope > a');
          if (anchor && !anchor.querySelector('.ex-navbar-chevron')) {
            const chevron = document.createElement('span');
            chevron.className = `ex-navbar-chevron ex-navbar-chevron-${level === 1 ? 'down' : 'right'}`;
            chevron.setAttribute('aria-hidden', 'true');
            anchor.appendChild(chevron);
          }

          annotate(subList, level + 1);
        }
      });
    };
    annotate(topList, 1);

    // Reveal a sub navigation only on click or Enter of its parent link, for accessibility.
    // The parent link acts as a disclosure control: activating it toggles its sub menu open or
    // closed instead of navigating. `aria-haspopup`/`aria-expanded` describe the state to
    // assistive technology.
    const closeMenu = (li) => {
      if (!li) return;
      li.classList.remove('ex-navbar-open');
      const anchor = li.querySelector(':scope > a');
      if (anchor) anchor.setAttribute('aria-expanded', 'false');
      // Collapse any descendants that were left open as well.
      li.querySelectorAll('.ex-navbar-open').forEach((child) => {
        child.classList.remove('ex-navbar-open');
        const childAnchor = child.querySelector(':scope > a');
        if (childAnchor) childAnchor.setAttribute('aria-expanded', 'false');
      });
    };

    const setupToggle = (li) => {
      const anchor = li.querySelector(':scope > a');
      if (!anchor) return;
      anchor.setAttribute('aria-haspopup', 'true');
      anchor.setAttribute('aria-expanded', 'false');

      const toggle = (event) => {
        event.preventDefault();
        const willOpen = !li.classList.contains('ex-navbar-open');

        // Close sibling menus at the same level so only one branch is open at a time.
        [...li.parentElement.children].forEach((sibling) => {
          if (sibling !== li) closeMenu(sibling);
        });

        if (willOpen) {
          li.classList.add('ex-navbar-open');
          anchor.setAttribute('aria-expanded', 'true');
        } else {
          closeMenu(li);
        }
      };

      // A click on an anchor also fires when the user presses Enter while it is focused, so this
      // single handler covers both click and Enter. Space is handled explicitly because anchors
      // do not activate on Space by default.
      anchor.addEventListener('click', toggle);
      anchor.addEventListener('keydown', (event) => {
        if (event.key === ' ') toggle(event);
      });
    };

    links.querySelectorAll('.ex-navbar-has-children').forEach(setupToggle);

    // Close every open menu when the user clicks outside the navigation or presses Escape.
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
