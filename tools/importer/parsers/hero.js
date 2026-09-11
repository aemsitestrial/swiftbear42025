/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: hero
 * Base block: hero
 * Source: https://main--swiftbear42025--aemsitestrial.aem.page/activity-page
 * Generated: 2026-09-11
 *
 * Structure (from library-description.txt): 1 column, 3 rows.
 *   Row 1: block name (added by createBlock)
 *   Row 2: image (optional)
 *   Row 3: text — title / subheading / CTA (optional)
 * xwalk model (blocks/hero/_hero.json): image (reference), imageAlt (collapsed → img alt), text (richtext).
 * Field hints: field:image, field:text. imageAlt is collapsed into the <img> alt attribute (no hint).
 */
export default function parse(element, { document }) {
  // Image lives in the first content row's picture (validated against source.html).
  const picture = element.querySelector('picture');
  // Title/heading lives in the second content row (h1 in source; allow variation).
  const heading = element.querySelector('h1, h2, h3, [class*="title"]');
  // Optional supporting text and CTAs for cross-page resilience.
  const description = element.querySelector('p');
  const ctaLinks = Array.from(element.querySelectorAll('a.button, a.cta, .button-container a'));

  // Empty-block guard.
  if (!picture && !heading && !description && ctaLinks.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: image cell with field hint.
  if (picture) {
    const imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(' field:image '));
    imageCell.appendChild(picture);
    cells.push([imageCell]);
  }

  // Row 3: text cell (heading + optional description + optional CTAs) with field hint.
  const textCell = document.createDocumentFragment();
  textCell.appendChild(document.createComment(' field:text '));
  if (heading) textCell.appendChild(heading);
  if (description) textCell.appendChild(description);
  ctaLinks.forEach((cta) => textCell.appendChild(cta));
  if (heading || description || ctaLinks.length) {
    cells.push([textCell]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero', cells });
  element.replaceWith(block);
}
