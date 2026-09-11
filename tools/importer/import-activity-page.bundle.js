/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-activity-page.js
  var import_activity_page_exports = {};
  __export(import_activity_page_exports, {
    default: () => import_activity_page_default
  });

  // tools/importer/parsers/hero.js
  function parse(element, { document }) {
    const picture = element.querySelector("picture");
    const heading = element.querySelector('h1, h2, h3, [class*="title"]');
    const description = element.querySelector("p");
    const ctaLinks = Array.from(element.querySelectorAll("a.button, a.cta, .button-container a"));
    if (!picture && !heading && !description && ctaLinks.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (picture) {
      const imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(" field:image "));
      imageCell.appendChild(picture);
      cells.push([imageCell]);
    }
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(" field:text "));
    if (heading) textCell.appendChild(heading);
    if (description) textCell.appendChild(description);
    ctaLinks.forEach((cta) => textCell.appendChild(cta));
    if (heading || description || ctaLinks.length) {
      cells.push([textCell]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards.js
  function parse2(element, { document }) {
    const cardItems = Array.from(element.querySelectorAll(":scope > ul > li, :scope li"));
    if (cardItems.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cardItems.forEach((li) => {
      const picture = li.querySelector(".cards-card-image picture, picture, img");
      const body = li.querySelector(".cards-card-body");
      const imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(" field:image "));
      if (picture) imageCell.appendChild(picture);
      const textCell = document.createDocumentFragment();
      textCell.appendChild(document.createComment(" field:text "));
      if (body) {
        Array.from(body.childNodes).forEach((node) => textCell.appendChild(node));
      }
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns.js
  function parse3(element, { document }) {
    const row = element.querySelector(":scope > div");
    const columnDivs = row ? Array.from(row.querySelectorAll(":scope > div")) : [];
    if (columnDivs.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const rowCells = columnDivs.map((col) => {
      const cellContent = Array.from(col.childNodes);
      return cellContent.length ? cellContent : "";
    });
    const cells = [rowCells];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/swiftbear42025-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header.header-wrapper",
        "header",
        "nav#nav",
        "footer.footer-wrapper",
        "footer"
      ]);
    }
  }

  // tools/importer/transformers/swiftbear42025-content-overrides.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.beforeTransform) {
      const heroHeading = element.querySelector(".hero h1");
      if (heroHeading && heroHeading.textContent.trim() === "Lorem ipsum dolor sit amet") {
        heroHeading.textContent = "Updated through AEM Coder";
      }
    }
  }

  // tools/importer/import-activity-page.js
  var parsers = {
    hero: parse,
    cards: parse2,
    columns: parse3
  };
  var transformers = [
    transform2,
    transform
  ];
  var PAGE_TEMPLATE = {
    name: "activity-page",
    description: "Activity page: hero banner, product card grid, and a two-column text+image section",
    urls: [
      "https://main--swiftbear42025--aemsitestrial.aem.page/activity-page"
    ],
    blocks: [
      {
        name: "hero",
        instances: [".hero.block", ".hero-wrapper > .hero"]
      },
      {
        name: "cards",
        instances: [".cards.block", ".cards-wrapper > .cards"]
      },
      {
        name: "columns",
        instances: [".columns.block", ".columns-wrapper > .columns"]
      }
    ],
    sections: [
      {
        id: "rc1",
        name: "main-content",
        selector: ["main > div.section", ".section.hero-container"],
        style: null,
        blocks: ["hero", "cards", "columns"],
        defaultContent: []
      }
    ]
  };
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    const seen = /* @__PURE__ */ new Set();
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element) => {
          if (seen.has(element)) return;
          seen.add(element);
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_activity_page_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_activity_page_exports);
})();
