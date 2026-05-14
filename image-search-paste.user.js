// ==UserScript==
// @name         Image Search Paste
// @namespace    none
// @license      MIT
// @version      0.1
// @description  saucenao搜图粘贴图像支持
// @match        https://saucenao.com/search.php
// @match        https://ascii2d.net/search/*
// @match        https://ascii2d.net/
// @grant        none
// ==/UserScript==

/*
Modified from https://greasyfork.org/zh-TW/scripts/534289-saucenao%E7%B2%98%E8%B4%B4%E5%9B%BE%E5%83%8F%E6%90%9C%E5%9B%BE
1. add more sites
2. auto submit form after paste
*/

document.addEventListener("paste", function (event) {
  const clipboardData = event.clipboardData || window.clipboardData;

  if (clipboardData) {
    const items = clipboardData.items;
    let fileInput;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.kind === "file") {
        const file = item.getAsFile();

        fileInput = document.querySelector('input[type="file"]');

        if (fileInput) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);

          fileInput.files = dataTransfer.files;

          const event = new Event("change", { bubbles: true });
          fileInput.dispatchEvent(event);

          console.log("File pasted:", file);
        }
        break;
      }
    }

    if (fileInput) {
      fileInput.form.submit();
    }
  }
});
