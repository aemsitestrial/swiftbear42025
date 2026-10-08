import decorateLogo from '../xe-logo/xe-logo.js';

export default function decorate(block) {
  // Get the logo row (3rd row)
  const logoRow = block.children[2];

  // when all logoRow is authorable
  decorateLogo(logoRow);

  // when not all logoRow is authorable
  // decorateLogo(logoRow, { type: 'lockup' });

  // when logoRow is not authorable
  // const logo = document.createElement('div');
  // logo.className = 'teaser-logo';
  // decorateLogo(logo, { variant: 'primary', size: 'md', type: 'lockup' });
  // block.append(logo);
}
