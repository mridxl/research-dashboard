// If this page is framed, break out. Skip for known allowed scenarios by customizing below.
(function () {
  try {
    if (window.top !== window.self) {
      // In a frame. Replace top location to bust out.
      window.top.location = window.location;
    }
  } catch {
    // If cross-origin access denied, still attempt to bust by setting top location via opener
    try {
      window.top.location = window.location;
    } catch {
      /* ignore */
    }
  }
})();
