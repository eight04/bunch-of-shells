// ==UserScript==
// @name        Video Player+
// @namespace   Violentmonkey Scripts
// @match       https://www.iwara.tv/*
// @match       https://video.twimg.com/*
// @grant       none
// @version     1.0
// @author      -
// @description 9/16/2024, 10:45:55 AM
// ==/UserScript==

let lastTouch = 0;
let lastTap;
const SPEEDUP_DELAY = 500;
let speedupId;

document.addEventListener("touchstart", e => {
  const video = findVideo(e.target);
  if (!video) return;
  lastTouch = Date.now();
  clearTimeout(speedupId);
  speedupId = setTimeout(() => {
    video.playbackRate = 2.0;
  }, SPEEDUP_DELAY);
});

document.addEventListener("touchend", e => {
  const video = findVideo(e.target);
  if (!video) return;
  clearTimeout(speedupId);
  video.playbackRate = 1.0;
  const ts = Date.now();
  if (ts - lastTouch < 200) {
    const tap = {
      ts,
      e
    };
    if (lastTap && tap.ts - lastTap.ts < 300) {
      const x = e.changedTouches[0].screenX;
      jump(video, x > screen.width / 2);
    }
    lastTap = tap;
  }
});

document.addEventListener("contextmenu", e => {
  const video = findVideo(e.target);
  if (!video) return;
  if (location.hostname === "video.twimg.com") return;
  e.preventDefault();
});

function jump(video, forward = false) {
  video.currentTime = Math.max(0, video.currentTime + (forward ? 1 : -1) * 10.0);
}

// if (location.hostname === "video.twimg.com") {
//   const video = document.querySelector("video");
//   const mask = document.createElement("div");
//   mask.id = "video-player-plus-mask";
//   mask.style.position = "absolute";
//   mask.style.margin = "auto";
//   mask.style.width = `${video.clientWidth}px`;
//   mask.style.height = `${video.clientHeight - 90}px`;
//   document.body.append(mask);
// }

function findVideo(el) {
  if (el.tagName === "VIDEO") return el;
  if (location.hostname === "video.twimg.com") {
    return document.querySelector("video");
  }
  // if (el.id === "video-player-plus-mask") return document.querySelector("video");
}
