interface DocumentElementWithFullscreen extends HTMLElement {
  mozRequestFullScreen?: () => Promise<void>;
  webkitRequestFullscreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

export const requestFullscreen = (): Promise<void> => {
  const doc = document.documentElement as DocumentElementWithFullscreen;
  if (doc.requestFullscreen) {
    return doc.requestFullscreen();
  }
  if (doc.mozRequestFullScreen) {
    return doc.mozRequestFullScreen();
  }
  if (doc.webkitRequestFullscreen) {
    return doc.webkitRequestFullscreen();
  }
  if (doc.msRequestFullscreen) {
    return doc.msRequestFullscreen();
  }
  return Promise.reject(new Error('Fullscreen API not supported'));
};

export const isFullscreen = (): boolean => {
  return !!document.fullscreenElement;
};
