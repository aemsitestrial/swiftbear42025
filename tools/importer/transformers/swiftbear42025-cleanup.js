/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: swiftbear42025 site-wide cleanup.
 *
 * Removes non-authorable site chrome from an already-rendered AEM Edge Delivery
 * page so the import contains only page-level authorable content
 * (main > .hero, .cards, .columns).
 *
 * All selectors verified against migration-work/cleaned.html:
 *   - <header class="header-wrapper"> ... <nav id="nav"> ...   (site header/nav)
 *   - <footer class="footer-wrapper"> ...                       (site footer)
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome (verified in cleaned.html).
    WebImporter.DOMUtils.remove(element, [
      'header.header-wrapper',
      'header',
      'nav#nav',
      'footer.footer-wrapper',
      'footer',
    ]);
  }
}
