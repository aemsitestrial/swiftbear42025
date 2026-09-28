import { moveInstrumentation } from '../../scripts/scripts.js';

const text = (el) => el?.textContent.trim() || '';

// Carry the Universal Editor field instrumentation over so the value stays editable.
const moveFieldInstrumentation = (cell, to) => {
  if (!cell) return;
  moveInstrumentation(cell.querySelector('[data-aue-prop]') || cell, to);
};

const createIcon = (icon, attrs) => {
  const el = document.createElement('xe-icon');
  Object.entries(attrs).forEach(([name, value]) => el.setAttribute(name, value));
  el.setAttribute('icon', icon);
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
  const [iconCell, headingCell, messageCell, actionCell] = [...block.children]
    .map((row) => row.firstElementChild);

  const banner = document.createElement('xe-banner');
  banner.setAttribute('variant', 'message');
  banner.setAttribute('size', 'generous');
  banner.setAttribute('background', 'default');

  const column = document.createElement('xe-banner-column');
  column.setAttribute('expand', '');
  column.setAttribute('align', 'center');
  column.setAttribute('heading-level', '2');
  banner.append(column);

  const icon = text(iconCell);
  if (icon) {
    column.append(createIcon(icon, { slot: 'icon', size: 'lg' }));
  }

  const heading = text(headingCell);
  if (heading) {
    const span = document.createElement('span');
    span.slot = 'heading';
    span.textContent = heading;
    moveFieldInstrumentation(headingCell, span);
    column.append(span);
  }

  if (text(messageCell)) {
    const message = document.createElement('div');
    message.slot = 'message';
    moveFieldInstrumentation(messageCell, message);
    message.append(...messageCell.childNodes);
    // Unwrap paragraphs, keeping a line break between consecutive ones.
    message.querySelectorAll('p').forEach((p, i) => {
      if (i > 0) p.before(document.createElement('br'));
      p.replaceWith(...p.childNodes);
    });
    column.append(message);
  }

  const action = readAction(actionCell);
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
