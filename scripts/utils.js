import { loadBlock } from './aem.js';

// Props passed to blocks rendered from code, keyed by the block element.
const blockProps = new WeakMap();

/**
 * Renders a block from code (no authoring needed) and waits for it to be decorated.
 * The block reads the props with getBlockProps().
 * @example await renderBlock(block, 'xe-logo', { size: 'md', variant: 'primary', type: 'lockup' });
 * @param {Element} target the element to render the block into
 * @param {string} blockName name of the block, e.g. 'xe-logo'
 * @param {Object} [props] block properties by field name
 * @param {InsertPosition} [position] where to insert the block, relative to target - beforeend (default), afterbegin, beforebegin, afterend
 * @returns {Promise<Element>} the block element
 */
export async function renderBlock(target, blockName, props = {}, position = 'beforeend') {
  const block = document.createElement('div');
  block.classList.add(blockName, 'block');
  block.dataset.blockName = blockName;
  block.dataset.blockStatus = 'initialized';
  blockProps.set(block, props);
  target.insertAdjacentElement(position, block);
  return loadBlock(block);
}

/**
 * Reads a block's properties: props passed to renderBlock() win, then the authored cells
 * (one row per field, in model order), then the defaults.
 * @param {Element} block the block element
 * @param {Object} defaults default value by field name, keys in the same order as the model
 * @returns {Object} property value by field name
 */
export function getBlockProps(block, defaults) {
  const props = blockProps.get(block) || {};
  const cells = [...block.children];
  return Object.fromEntries(Object.entries(defaults).map(([name, fallback], i) => [
    name,
    props[name] ?? (cells[i]?.textContent.trim() || fallback),
  ]));
}
