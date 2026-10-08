import decorateLogo from '../xe-logo/xe-logo.js';

export default function decorate(block) {
  // Get the logo row (3rd row)
  const logoRow = block.children[2];

  decorateLogo(logoRow);

  // The logo is not authored: it always renders the xe-logo after the teaser content.
  // const logo = document.createElement('div');
  // logo.className = 'teaser-logo';
  // decorateLogo(logo, { variant: 'primary', size: 'md', type: 'lockup' });
  // block.append(logo);
}
