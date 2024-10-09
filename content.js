function getImagesInfo() {
  const images = Array.from(document.images);
  return images.map(img => ({
    src: img.src,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight
  }));
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getImagesInfo") {
    const imagesInfo = getImagesInfo();
    sendResponse(imagesInfo);
  }
  return true;  // Indicates that we will send a response asynchronously
});
