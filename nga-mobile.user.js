// ==UserScript==
// @name               nga mobile
// @namespace          https://github.com/eight04
// @description        nga mobile layout fix
// @license            MIT
// @version            0.1.1
// @match              https://bbs.nga.cn/*
// @run-at document-start
// @grant              GM_addStyle
// ==/UserScript==

waitForElement("meta[name=viewport]")
  .then(el => el.replaceWith(createViewportMeta()));

GM_addStyle(`
#minWidthSpacer {
  display: none !important;
}
#mc {
  width: 100% !important;
}
.postcontent img {
  max-width: 100% !important;
  margin: 0 !important;
}
`);

function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector);
    if (el) {
      resolve(el);
      return;
    }
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout waiting for element: ${selector}`));
    }, timeout);
  });
}

function createViewportMeta() {
  const meta = document.createElement("meta");
  meta.name = "viewport";
  meta.content = "width=device-width, initial-scale=1";
  return meta;
}

