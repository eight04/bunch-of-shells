// ==UserScript==
// @name Live Chat on YouTube Mobile
// @author Adam Jensen
// @version 1.3.3
// @description Integrates the live chat into the mobile version of YouTube
// @match https://m.youtube.com/*
// @match https://www.youtube.com/live_chat_replay*
// @grant GM_xmlhttpRequest
// @namespace https://greasyfork.org/en/scripts/519614-live-chat-on-youtube-mobile
// @license MIT
// @downloadURL https://update.greasyfork.org/scripts/519614/Live%20Chat%20on%20YouTube%20Mobile.user.js
// @updateURL https://update.greasyfork.org/scripts/519614/Live%20Chat%20on%20YouTube%20Mobile.meta.js
// @connect www.youtube.com
// ==/UserScript==

const getVideoId = () => (window.location.search.match(/v=([^&]+)/) || [])[1];

class IframeState {
  el = null;
  _src = 'about:blank';
  loaded = false;
  error = null;
  abortController = null;

  constructor(el) {
    this.el = el;

    // NOTE: iframe has no error event
    this.el.addEventListener('load', () => {
      this.loaded = true;
      this.error = null;
    });
  }

  get src() {
    return this._src;    
  }
  set src(value) {
    this._src = value;
    this.loaded = false;
    this.error = null;
    this.el.contentWindow.location.replace(value);
    this.abortController?.abort();
    this.abortController = new AbortController();
    // FIXME: abort after 20s? does it make sense?
  }

  waitUntilLoaded() {
    return new Promise((resolve, reject) => {
      if (this.loaded) {
        resolve();
        return;
      }
      if (this.abortController?.signal.aborted) {
        reject(new Error('Iframe load aborted'));
        return;
      }
      const onLoad = () => {
        cleanup();
        resolve();
      };
      const onAbort = () => {
        cleanup();
        reject(new Error('Iframe load aborted'));
      };
      const cleanup = () => {
        this.el.removeEventListener('load', onLoad);
        this.abortController?.signal.removeEventListener('abort', onAbort);
      };
      this.el.addEventListener('load', onLoad);
      this.abortController?.signal.addEventListener('abort', onAbort);
    });
  }
}

function getContinuation() {
  return new Promise((resolve, reject) => {
    const url = `https://www.youtube.com/watch?v=${getVideoId()}`;
    GM_xmlhttpRequest({
      method: "GET",
      url,
      // pretend to be desktop
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      onload: (response) => {
        if (response.status === 200) {
          const text = response.responseText;
          const match = text.match(/"continuation":"([^"]+)"/);
          if (match) {
            resolve(match[1]);
          } else {
            reject(new Error("Continuation token not found"));
          }
        } else {
          reject(new Error(`Failed to fetch video page: ${response.status}`));
        }
      },
      onerror: (error) => {
        reject(new Error(`Network error: ${error.message}`));
      },
    });
  });
}

if (location.pathname.startsWith("/live_chat_replay")) {
  initLiveChatReplay();
} else {
  initMainPage();
}

function initLiveChatReplay() {
  if (window.parent === window) return;

  window.addEventListener("message", ({data}) => {
    if (data?.method === "getCurrentTimeResponse") {
      const newData = { "yt-player-video-progress": data.currentTime };
      // NOTE: live_chat_replay doesn't accept messages from different origins, so we need to re-post them from the iframe itself
      window.postMessage(newData, "*");
    }
  });

  setInterval(() => {
    if (document.hidden) return;
    window.parent.postMessage({method: "getCurrentTime"}, "*");
  }, 1000);

  // TODO: report sub-frame-error-details to parent
}

function initMainPage() {
  // CONFIGURATION
  const AUTO_HIDE_CHAT_BUTTON = true; // If true, the button only appears when a Live/Premiere is detected
  const AUTO_SHOW_CHAT = false; // If true, the chat automatically opens when a Live/Premiere loads.
  const IFRAME_RESET_ON_CLOSE = true; // If true, the iframe src resets to about:blank when chat is closed to free up resources

  let currentVideoId = null,
    observer = null,
    previousWidth = window.innerWidth,
    isChatVisible = false;
  const elements = {};
  let iframeState = null;

  const initializeMessageListener = () => {
    window.addEventListener("message", e => {
      if (e.source && e.source !== elements.chatIframe.contentWindow) return;

      if (e.data?.method === "getCurrentTime") {
        if (!elements.video.offsetParent) {
          updateDOMElementsCache();
        }
        const currentTime = elements.video?.currentTime;
        if (!currentTime) return;
        elements.chatIframe.contentWindow.postMessage(
          { method: "getCurrentTimeResponse", currentTime },
          "*",
        );
      }
    });
  };

  const isVideoPage = () =>
    window.location.pathname === "/watch" &&
    window.location.search.includes("v=");
  const isPortraitOrientation = () => window.innerHeight > window.innerWidth;

  const shouldShowChatButton = () => {
    if (!AUTO_HIDE_CHAT_BUTTON) {
      return true;
    }

    const infoContainer = elements.infoContainer;
    if (infoContainer) {
      return isLive() || isArchive();
    }
    return false;
  };

  function isLive() {
    const content = elements.infoContainer?.textContent.toLowerCase() || "";
    return content.includes("watching now") ||
      content.includes("personas mirando ahora") ||
      content.includes("usuarios viéndolo ahora") ||
      content.includes("viewing now") ||
      content.includes("人正在观看") ||
      content.includes("人正在觀看") ||
      content.includes("人が視聴中") ||
      content.includes("a ver agora") ||
      content.includes("assistindo agora") ||
      content.includes("spettatori attuali") ||
      content.includes("人正在等候")
  }

  function isArchive() {
    const content = elements.infoContainer?.textContent.toLowerCase() || "";
    return content.includes("直播時間")
  }

  const showErrorMessage = () => {
    elements.loader.style.display = "none";
    elements.errorContainer.style.display = "flex";
  };

  const hideErrorMessage = () => {
    elements.errorContainer.style.display = "none";
  };
  const showLoader = (darkbackground = "#111") => {
    elements.loader.style.display = "block";
    elements.chatIframe.style.opacity = "0";
    elements.chatContainer.style.backgroundColor = darkbackground;
  };

  const hideLoader = () => {
    elements.loader.style.display = "none";
    elements.chatIframe.style.opacity = "1";
    elements.chatContainer.style.backgroundColor = "#333";
  };

  const updateChatPosition = () => {
    const videoPlayer = elements.videoPlayer;
    if (videoPlayer && videoPlayer.clientHeight > 0) {
      const videoRect = videoPlayer.getBoundingClientRect();
      const isVerticalVideo =
        videoRect.height > videoRect.width && videoRect.height > 100;
      elements.chatContainer.style.top = isVerticalVideo
        ? "50%"
        : `${videoRect.bottom}px`;
      elements.chatContainer.style.height = isVerticalVideo ? "50%" : "auto";
      elements.chatContainer.style.bottom = "0";
    } else {
      elements.chatContainer.style.top = "250px";
      elements.chatContainer.style.height = "auto";
    }
  };

  const setButtonVisibility = (visible) => {
    elements.button.style.display =
      visible && isPortraitOrientation() && shouldShowChatButton()
        ? "block"
        : "none";
  };

  const closeChat = () => {
    if (elements.chatContainer.style.display !== "none") {
      hideErrorMessage();
      elements.chatContainer.style.display = "none";
      elements.button.innerText = "💬";
      document.body.classList.remove("chat-open-no-scroll");
      isChatVisible = false;

      if (IFRAME_RESET_ON_CLOSE) {
        iframeState.src = "about:blank";
      }
    }
  };

  const showChat = () => {
    if (iframeState.src === "about:blank") {
      preloadChatIframe({forced: true});
    }
    updateChatPosition();
    elements.chatContainer.style.display = "block";
    document.body.classList.add("chat-open-no-scroll");
    elements.button.innerText = "✖️";
    isChatVisible = true;

    if (iframeState.error) {
      showErrorMessage();
    // } else if (!iframeState.loaded) {
    //   showLoader();
    } else {
      hideLoader();
    }
    // FIXME: why do we need focus
    // elements.chatIframe.focus();
  };

  const toggleChat = () => {
    if (elements.button.style.display === "none") return;

    if (!isChatVisible) {
      showChat();
    } else {
      closeChat();
    }
  };

  const preloadChatIframe = ({forced = false} = {}) => {
    const videoId = getVideoId();

    if (
      isVideoPage() &&
      videoId &&
      shouldShowChatButton() &&
      videoId !== currentVideoId ||
      forced
    ) {
      currentVideoId = videoId;
      hideErrorMessage();

      const getNewIframeSrc = async () => {
        if (isLive()) {
          console.log("Detected live stream, loading live chat");
          return `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${window.location.hostname}`;
        }
        console.log("Detected non-live stream, loading chat replay");
        const continuation = await getContinuation();
        return `https://www.youtube.com/live_chat_replay?embed_domain=${window.location.hostname}&dark_theme=1&continuation=${continuation}`;
      };
      getNewIframeSrc().then(async (src) => {
        showLoader();
        try {
          iframeState.src = src;
          await iframeState.waitUntilLoaded();
        } catch (error) {
          console.error("Error loading chat iframe:", error);
          showErrorMessage();
        } finally {
          hideLoader();
        }
      });
    } else if (videoId === currentVideoId && iframeState.loaded) {
      setButtonVisibility(true);
    }
  };

  const updateDOMElementsCache = () => {
    elements.videoPlayer = document.querySelector(".player-container");
    elements.video = elements.videoPlayer ? elements.videoPlayer.querySelector("video") : null;
    elements.infoContainer = document.querySelector(
      ".slim-video-information-content",
    );
  };

  const handlePageAndVideoState = () => {
    const onVideoPage = isVideoPage();
    const newVideoId = getVideoId();

    if (onVideoPage && newVideoId !== currentVideoId) {
      updateDOMElementsCache();
      preloadChatIframe();
      hideErrorMessage();

      if (AUTO_SHOW_CHAT && isPortraitOrientation() && shouldShowChatButton()) {
        showChat();
      }
    } else if (!onVideoPage) {
      elements.videoPlayer = null;
      elements.infoContainer = null;
      currentVideoId = null;
      iframeState.src = "about:blank";
    }

    setButtonVisibility(onVideoPage);

    if (!onVideoPage) {
      closeChat();
    } else if (isChatVisible) {
      if (newVideoId && newVideoId !== currentVideoId) {
        closeChat();
      } else if (!isPortraitOrientation() || !shouldShowChatButton()) {
        closeChat();
      } else {
        updateChatPosition();
      }
    }
  };

  const createUIElements = () => {
    elements.button = document.createElement("button");
    Object.assign(elements.button.style, {
      position: "fixed",
      bottom: "64px",
      right: "20px",
      zIndex: "9999",
      padding: "10px",
      backgroundColor: "#ff0000",
      color: "#fff",
      border: "none",
      borderRadius: "50%",
      width: "45px",
      height: "45px",
      fontSize: "20px",
      lineHeight: "0",
      boxShadow: "0 3px 6px rgba(0,0,0,0.3)",
      cursor: "pointer",
      display: "none",
    });
    elements.button.innerText = "💬";
    document.body.appendChild(elements.button);

    elements.chatContainer = document.createElement("div");
    Object.assign(elements.chatContainer.style, {
      display: "none",
      position: "fixed",
      width: "100%",
      top: "250px",
      bottom: "0",
      height: "auto",
      left: "0",
      right: "0",
      borderTop: "1px solid #555",
      backgroundColor: "#333",
      zIndex: "9998",
      overflow: "hidden",
    });
    document.body.appendChild(elements.chatContainer);

    elements.chatIframe = document.createElement("iframe");
    Object.assign(elements.chatIframe.style, {
      width: "100%",
      height: "100%",
      border: "none",
      maxWidth: "100%",
      opacity: "0",
    });
    elements.chatContainer.appendChild(elements.chatIframe);

    iframeState = new IframeState(elements.chatIframe);

    elements.loader = document.createElement("div");
    Object.assign(elements.loader.style, {
      border: "4px solid #555",
      borderTop: "4px solid #ff0000",
      borderRadius: "50%",
      width: "30px",
      height: "30px",
      animation: "spin 1s linear infinite",
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: "10000",
      display: "none",
    });
    elements.chatContainer.appendChild(elements.loader);

    elements.errorContainer = document.createElement("div");
    Object.assign(elements.errorContainer.style, {
      display: "none",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
      height: "100%",
      position: "absolute",
      top: "0",
      left: "0",
      color: "#fff",
    });
    elements.chatContainer.appendChild(elements.errorContainer);

    const errorMessage = document.createElement("p");
    errorMessage.innerText = "Error loading chat.";
    elements.errorContainer.appendChild(errorMessage);

    elements.retryButton = document.createElement("button");
    elements.retryButton.innerText = "Retry";
    Object.assign(elements.retryButton.style, {
      padding: "10px 20px",
      backgroundColor: "#ff0000",
      color: "#fff",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      marginTop: "10px",
    });
    elements.errorContainer.appendChild(elements.retryButton);

    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `@keyframes spin { 0% { transform: translate(-50%, -50%) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg); } } .chat-open-no-scroll { overflow: hidden !important; position: fixed !important; width: 100% !important; height: 100% !important; }`;
    document.head.appendChild(styleSheet);
  };

  const updateButtonSize = () => {
    if (!elements.button) return;
    const buttonSize = Math.max(
      45,
      Math.min(60, Math.min(window.innerWidth, window.innerHeight) * 0.12),
    );
    const fontSize = buttonSize * 0.45;
    elements.button.style.width = `${buttonSize}px`;
    elements.button.style.height = `${buttonSize}px`;
    elements.button.style.fontSize = `${fontSize}px`;
  };

  const initializeObserver = () => {
    const targetNode = document.querySelector("body");
    if (targetNode) {
      observer = new MutationObserver(() =>
        setTimeout(handlePageAndVideoState, 100),
      );
      observer.observe(targetNode, { childList: true, subtree: true });
    }

    window.addEventListener("popstate", handlePageAndVideoState);
    window.addEventListener("resize", () => {
      const isRotationDetected = window.innerWidth !== previousWidth;
      updateButtonSize();
      if (isRotationDetected) {
        handlePageAndVideoState();
      } else if (isChatVisible) updateChatPosition();
      previousWidth = window.innerWidth;
    });
    handlePageAndVideoState();
  };

  const initialize = () => {
    if (window.self !== window.top) return;
    createUIElements();
    updateButtonSize();

    updateDOMElementsCache();

    elements.button.addEventListener("click", toggleChat);

    elements.retryButton.addEventListener("click", () => {
      hideErrorMessage();
      showLoader();
      preloadChatIframe();
    });

    preloadChatIframe();

    initializeObserver();

    initializeMessageListener();
  };

  initialize();
}
