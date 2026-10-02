import { loadBlock } from '../../scripts/aem.js';

export default async function decorate(block) {
  // The teaser's own fields render as the first two rows (image, text). Any rows after that are
  // child items, and the teaser filter only allows xe-logo children.
  const logoRows = [...block.children].slice(2);
  await Promise.all(logoRows.map((row) => {
    row.dataset.blockName = 'xe-logo';
    return loadBlock(row);
  }));
}
