export default function decorate(block) {
  const rows = [...block.children];
  const brand = rows[0];
  const brandLink = rows[1];
  const links = rows[2];

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
    links.classList.add('xe-navbar-links');
    links.dataset.blockName = 'xe-navbar-links';

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
      list.classList.add('xe-navbar-level', `xe-navbar-level-${level}`);
      [...list.children].forEach((li) => {
        if (li.tagName !== 'LI') return;
        const subList = li.querySelector(':scope > ul');
        if (subList) {
          li.classList.add('xe-navbar-has-children');
          annotate(subList, level + 1);
        }
      });
    };
    annotate(links.querySelector('ul'), 1);
  }
}
