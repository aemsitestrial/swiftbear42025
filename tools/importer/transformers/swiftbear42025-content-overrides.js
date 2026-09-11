/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: swiftbear42025 content overrides.
 *
 * Applies author-requested content edits to the source DOM before block
 * parsing, so the change flows through the normal import pipeline rather than
 * hand-editing generated content files.
 *
 * Overrides:
 *   - Hero heading text: "Lorem ipsum dolor sit amet" -> "Updated through AEM Coder"
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    const heroHeading = element.querySelector('.hero h1');
    if (heroHeading && heroHeading.textContent.trim() === 'Lorem ipsum dolor sit amet') {
      heroHeading.textContent = 'Updated through AEM Coder';
    }
  }
}
