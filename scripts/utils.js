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
