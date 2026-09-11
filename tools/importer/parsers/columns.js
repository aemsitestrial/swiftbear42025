/* eslint-disable */
/* global WebImporter */
/**
 * Parser for variant: columns
 * Base block: columns
 * Source: https://main--swiftbear42025--aemsitestrial.aem.page/activity-page
 * Generated: 2026-09-11
 *
 * Structure (from library-description.txt): multiple columns/rows; base number of
 * columns on the visual grouping in the source. Source (columns-2-cols) is one row
 * with two cells: a text paragraph and an image.
 * xwalk: Columns blocks do NOT use field hints (hinting.md Rule 4) — cells hold
 * default content only.
 */
export default function parse(element, { document }) {
  // The single content row wraps the column cells (validated against source.html).
  const row = element.querySelector(':scope > div');
  const columnDivs = row
    ? Array.from(row.querySelectorAll(':scope > div'))
    : [];

  // Empty-block guard.
  if (columnDivs.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Each direct child div of the row becomes one column cell (default content, no hints).
  const rowCells = columnDivs.map((col) => {
    const cellContent = Array.from(col.childNodes);
    return cellContent.length ? cellContent : '';
  });

  const cells = [rowCells];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
  element.replaceWith(block);
}
