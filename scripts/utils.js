/**
 * Reads a block's properties: props passed in win, then the authored content, then the defaults.
 * Fields are read one row per field, in model order. When the fields share a prefix they're
 * grouped into a single cell with one <p> per field, so a single row (or cell) holding several
 * fields is read one <p> per field instead.
 * Settings passed as props are set by code, so they have no authored field and are skipped
 * when matching the authored values to settings.
 * @param {Element} block the block element, or a row of another block that holds the fields
 * @param {Object} defaults default value by field name, keys in the same order as the model
 * @param {Object} [props] settings set by code, by field name
 * @returns {Object} property value by field name
 */
export function getBlockProps(block, defaults, props = {}) {
  const authored = Object.keys(defaults).filter((name) => !Object.hasOwn(props, name));
  const children = [...block.children];
  const grouped = authored.length > 1 && children.length === 1;
  const paragraphs = grouped ? [...children[0].querySelectorAll('p')] : [];
  const cells = paragraphs.length ? paragraphs : children;
  const values = Object.fromEntries(authored.map((name, i) => [
    name,
    cells[i]?.textContent.trim() || defaults[name],
  ]));
  return { ...defaults, ...values, ...props };
}
