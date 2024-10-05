console.log('Content script loaded for', window.location.href);
document.body.style.border = '5px solid red';

function getImagesInfo() {
  const images = Array.from(document.images);
  return images.map(img => ({
    src: img.src,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight
  }));
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in content script', request);
  if (request.action === "getImagesInfo") {
    console.log('Getting images info');
    const imagesInfo = getImagesInfo();
    console.log('Sending images info back to popup', imagesInfo);
    sendResponse(imagesInfo);
  }
  return true;  // Indicates that we will send a response asynchronously
});

console.log('Content script setup completed');
XMLDocument
