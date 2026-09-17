export default function decorate(block) {
  const rows = [...block.children];
  const brand = rows[0];
  const brandLink = rows[1];
  const links = rows[2];

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
  }
}