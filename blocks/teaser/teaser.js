import decorateLogo from '../xe-logo/xe-logo.js';

export default function decorate(block) {
  // Get the logo row (3rd row)
  const logoRow = block.children[2];

  decorateLogo(logoRow, { variant: 'inverse' });
}
