/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: cards
 * Base block: cards
 * Source: https://main--swiftbear42025--aemsitestrial.aem.page/activity-page
 * Generated: 2026-09-11
 *
 * Structure (from library-description.txt): 2 columns, multiple rows.
 *   Row 1: block name (added by createBlock)
 *   Each subsequent row = one card: [image cell, text cell]
 * xwalk model (blocks/cards/_cards.json → card): image (reference), text (richtext).
 * Field hints: field:image (image cell), field:text (text cell).
 */
export default function parse(element, { document }) {
  // Each card is a <li> in the source (validated against source.html).
  const cardItems = Array.from(element.querySelectorAll(':scope > ul > li, :scope li'));

  // Empty-block guard.
  if (cardItems.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  cardItems.forEach((li) => {
    // Image: prefer the picture inside the image container; fall back to any picture/img.
    const picture = li.querySelector('.cards-card-image picture, picture, img');
    // Text body: prefer the body container; fall back to remaining content.
    const body = li.querySelector('.cards-card-body');

    // Image cell with field hint.
    const imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(' field:image '));
    if (picture) imageCell.appendChild(picture);

    // Text cell with field hint.
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    if (body) {
      Array.from(body.childNodes).forEach((node) => textCell.appendChild(node));
    }

    cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
  element.replaceWith(block);
}
