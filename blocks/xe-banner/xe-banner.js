import { moveInstrumentation } from '../../scripts/scripts.js';
import { getBlockProps } from '../../scripts/utils.js';

// Key order matches the row order of the xe-banner model (the bannerAction_* fields share one row).
// When rendered from code, bannerAction is an object: { label, link, icon }.
const DEFAULTS = {
  bannerIcon: '', bannerHeading: '', bannerMessage: '', bannerAction: {},
};

const text = (el) => el?.textContent.trim() || '';

// Carry the Universal Editor field instrumentation over so the value stays editable.
const moveFieldInstrumentation = (cell, to) => {
  if (!cell) return;
  moveInstrumentation(cell.querySelector('[data-aue-prop]') || cell, to);
};

// Font Awesome Free by @fontawesome - https://fontawesome.com
// License - https://fontawesome.com/license/free (Icons: CC BY 4.0)
const ICONS = {
  faLeaf: {
    viewBox: '0 0 512 512',
    path: 'M272 96c-78.6 0-145.1 51.5-167.7 122.5c33.6-17 71.5-26.5 111.7-26.5h88c8.8 0 16 7.2 16 16s-7.2 16-16 16H288 216s0 0 0 0c-16.6 0-32.7 1.9-48.3 5.4c-25.9 5.9-49.9 16.4-71.4 30.7c0 0 0 0 0 0C38.3 298.8 0 364.9 0 440v16c0 13.3 10.7 24 24 24s24-10.7 24-24V440c0-48.7 20.7-92.5 53.8-123.2C121.6 392.3 190.3 448 272 448l1 0c132.1-.7 239-130.9 239-291.4c0-42.6-7.5-83.1-21.1-119.6c-2.6-6.9-12.7-6.6-16.2 .1C455.9 72.1 418.7 96 376 96L272 96z',
  },
  faArrowRight: {
    viewBox: '0 0 448 512',
    path: 'M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z',
  },
};

const SVG_NS = 'http://www.w3.org/2000/svg';

const createIcon = (icon, attrs) => {
  const el = document.createElement('xe-icon');
  Object.entries(attrs).forEach(([name, value]) => el.setAttribute(name, value));
  el.setAttribute('icon', icon);

  // Fallback artwork, shown by the block CSS until xe-icon is defined.
  if (Object.hasOwn(ICONS, icon)) {
    const { viewBox, path } = ICONS[icon];
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', viewBox);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const shape = document.createElementNS(SVG_NS, 'path');
    shape.setAttribute('d', path);
    svg.append(shape);
    el.append(svg);
  }
  return el;
};

/**
 * Reads the grouped action cell (bannerAction_linkText, bannerAction_link, bannerAction_icon).
 * The label and link may arrive collapsed into an anchor or as separate values.
 */
const readAction = (cell) => {
  if (!cell) return {};
  const anchor = cell.querySelector('a');
  const paragraphs = [...cell.querySelectorAll('p')];
  const values = (paragraphs.length ? paragraphs : [cell])
    .filter((p) => !p.querySelector('a'))
    .map(text)
    .filter(Boolean);

  if (anchor) {
    return {
      label: text(anchor),
      link: anchor.getAttribute('href'),
      icon: values[0],
    };
  }

  const [label, link, icon] = values;
  return { label, link, icon };
};

export default function decorate(block) {
  const [, headingCell, messageCell, actionCell] = [...block.children]
    .map((row) => row.firstElementChild);
  const props = getBlockProps(block, DEFAULTS);

  const banner = document.createElement('xe-banner');
  banner.setAttribute('variant', 'message');
  banner.setAttribute('size', 'generous');
  banner.setAttribute('background', 'default');

  const column = document.createElement('xe-banner-column');
  column.setAttribute('expand', '');
  column.setAttribute('align', 'center');
  column.setAttribute('heading-level', '2');
  banner.append(column);

  if (props.bannerIcon) {
    column.append(createIcon(props.bannerIcon, { slot: 'icon', size: 'lg' }));
  }

  if (props.bannerHeading) {
    const span = document.createElement('span');
    span.slot = 'heading';
    span.textContent = props.bannerHeading;
    moveFieldInstrumentation(headingCell, span);
    column.append(span);
  }

  if (props.bannerMessage) {
    const message = document.createElement('div');
    message.slot = 'message';
    if (messageCell) {
      // Authored rich text: keep the markup instead of the plain-text prop value.
      moveFieldInstrumentation(messageCell, message);
      message.append(...messageCell.childNodes);
    } else {
      message.textContent = props.bannerMessage;
    }
    // Unwrap paragraphs, keeping a line break between consecutive ones.
    message.querySelectorAll('p').forEach((p, i) => {
      if (i > 0) p.before(document.createElement('br'));
      p.replaceWith(...p.childNodes);
    });
    column.append(message);
  }

  // Authored action rows come through as text; props from code are already { label, link, icon }.
  const action = typeof props.bannerAction === 'string'
    ? readAction(actionCell)
    : props.bannerAction;
  if (action.label && action.link) {
    const button = document.createElement('xe-button');
    button.slot = 'action';
    button.setAttribute('variant', 'primary');
    button.setAttribute('treatment', 'outlined');
    button.setAttribute('size', 'sm');
    button.setAttribute('url', action.link);
    button.append(action.label);
    if (action.icon) {
      button.append(createIcon(action.icon, { slot: 'trailing-icon', size: 'sm' }));
    }
    column.append(button);
  }

  block.replaceChildren(banner);
}
