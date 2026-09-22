import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const rows = [...block.children];
  const brand = rows[0];
  const brandLink = rows[1];
  const links = rows[2];
  // Every row after the main links list is an ex-navbar-subnav child block. Each one maps to the
  // top level link at the same position and becomes that link's sub navigation.
  const subnavRows = rows.slice(3);

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
    // published side.
    const isEditor = !!block.closest('[data-aue-resource]');

    const topList = links.querySelector('ul');
    if (topList && !isEditor) {
      const topItems = [...topList.children].filter((li) => li.tagName === 'LI');
      const normalize = (text) => (text || '').trim().toLowerCase();

      // Match each ex-navbar-subnav block to a top level link by label. The subnav authors a
      // "Parent Link Label" holding the exact text of the top level link it belongs to; we attach
      // the subnav's list to the item whose link text matches. When no label is authored (or it
      // matches nothing) we fall back to mapping by position. The subnav's list becomes that
      // link's sub navigation, and any list nested within it becomes a third level, giving up to
      // 3 levels of navigation.
      subnavRows.forEach((row, index) => {
        const subList = row.querySelector('ul');
        // A freshly inserted subnav has no list yet. Leave the row untouched so the Universal
        // Editor keeps its data-aue-* handle and the author can still select and populate it.
        if (!subList) return;

        // The parent label is the row's text outside of the sub navigation list.
        const labelSource = row.cloneNode(true);
        labelSource.querySelectorAll('ul').forEach((ul) => ul.remove());
        const label = normalize(labelSource.textContent);

        let targetItem;
        if (label) {
          targetItem = topItems.find((li) => {
            const anchor = li.querySelector(':scope > a');
            return normalize(anchor?.textContent) === label;
          });
        }
        // Fall back to positional mapping when there is no usable label match.
        if (!targetItem) {
          targetItem = topItems[index];
        }

        // If nothing matched (more subnavs than top level links), leave the row in place rather
        // than silently discarding the authored content and its editor instrumentation.
        if (!targetItem) return;

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

    // Annotate each list with its nesting level (up to 3) and flag items that have a sub-menu,
    // so the CSS can reveal the nested navigation on hover.
    const annotate = (list, level) => {
      if (!list || level > 3) return;
      list.classList.add('ex-navbar-level', `ex-navbar-level-${level}`);
      [...list.children].forEach((li) => {
        if (li.tagName !== 'LI') return;
        const subList = li.querySelector(':scope > ul');
        if (subList) {
          li.classList.add('ex-navbar-has-children');
          annotate(subList, level + 1);
        }
      });
    };
    annotate(topList, 1);

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
