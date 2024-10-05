import { CO2 } from './esm/co2.js';

const button = document.getElementById('click-me');
const loading = document.querySelector('.loading');
const result = document.getElementById('result');

console.log('Popup script started');

async function injectContentScript(tabId) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        files: ['content.js']
      },
      (injectionResults) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(injectionResults);
        }
      }
    );
  });
}

async function getImagesInfo() {
  console.log('getImagesInfo started');
  return new Promise((resolve) => {
    chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
      console.log('Tab query completed');
      if (chrome.runtime.lastError) {
        console.error('Error querying tabs:', chrome.runtime.lastError);
        resolve([]);
        return;
      }

      if (tabs.length === 0) {
        console.error('No active tab found');
        resolve([]);
        return;
      }

      try {
        await injectContentScript(tabs[0].id);
        console.log('Content script injected');

        console.log('Sending message to content script');
        chrome.tabs.sendMessage(tabs[0].id, {action: "getImagesInfo"}, (response) => {
          console.log('Received response from content script', response);
          if (chrome.runtime.lastError) {
            console.error('Error sending message:', chrome.runtime.lastError);
            resolve([]);
          } else {
            resolve(response || []);
          }
        });
      } catch (error) {
        console.error('Error injecting content script:', error);
        resolve([]);
      }
    });
  });
}

async function predictCO2AndGreenStatus(url) {
  console.log('predictCO2AndGreenStatus started');
  const emissions = new CO2({ model: "swd", version: 4 });

  console.log('Getting images info');
  let imagesInfo;
  try {
    imagesInfo = await getImagesInfo();
  } catch (error) {
    console.error('Error getting images info:', error);
    imagesInfo = [];
  }
  console.log('Images info received:', imagesInfo);

  // Function to estimate image size based on dimensions
  function estimateImageSize(width, height) {
    // Rough estimate: 3 bytes per pixel (RGB) + some overhead
    return width * height * 3 * 1.1;
  }

  // Calculate total estimated image size
  const totalImageSize = imagesInfo.reduce((total, img) => {
    return total + estimateImageSize(img.naturalWidth, img.naturalHeight);
  }, 0);

  // Get actual page size
  let actualPageSize = 0;
  try {
    const response = await fetch(url);
    const text = await response.text();
    actualPageSize = new Blob([text]).size;
  } catch (error) {
    console.error('Error fetching page size:', error);
    actualPageSize = 100000; // Fallback to 100 KB if fetch fails
  }

  const totalBytes = actualPageSize + totalImageSize;

  const co2Result = await emissions.perVisit(totalBytes);
  const co2Grams = typeof co2Result === 'number' ? co2Result : co2Result.co2;

  const hostname = new URL(url).hostname;
  async function greenStatus(hostname) {
    try {
      const response = await fetch(`https://api.thegreenwebfoundation.org/api/v3/greencheck/${hostname}`, {
        method: "GET",
      });
      const data = await response.json();
      return data.green;
    } catch (error) {
      console.error('Error checking green status:', error);
      return false;
    }
  }

  // Call the greenStatus function and await its result
  const isGreen = await greenStatus(hostname);

  const averageCO2 = 4.61; // Update this value based on more recent data if available
  const cleanerThanPercentage = Math.max(0, Math.min(100, (1 - (co2Grams / averageCO2)) * 100)).toFixed(0);

  console.log('CO2 calculation completed');

  // Analyze image types and suggest optimizations
  const imageAnalysis = analyzeImages(imagesInfo);
  console.log('Image analysis:', imageAnalysis);

  function analyzeImages(images) {
    const analysis = {
      suggestions: [],
      inefficientCount: 0,
      largeImageCount: 0
    };

    images.forEach(img => {
      const fileType = getFileTypeFromSrc(img.src);
      if (fileType === 'png' || fileType === 'bmp') {
        analysis.inefficientCount++;
        if (fileType === 'png') {
          analysis.suggestions.push(`Consider converting PNG to WebP for better compression.`);
        } else if (fileType === 'bmp') {
          analysis.suggestions.push(`Consider converting BMP to a more efficient format like JPEG or WebP.`);
        }
      }
      // Check for large images that might benefit from compression
      if (img.naturalWidth > 1000 || img.naturalHeight > 1000) {
        analysis.largeImageCount++;
      }
    });

    if (analysis.largeImageCount > 0) {
      analysis.suggestions.push(`${analysis.largeImageCount} large images detected. Consider resizing or compressing images larger than 1000x1000.`);
    }

    // Remove duplicate suggestions
    analysis.suggestions = [...new Set(analysis.suggestions)];

    return analysis;
  }

  function getFileTypeFromSrc(src) {
    const extension = src.split('.').pop().toLowerCase();
    return extension.split('?')[0]; // Remove query parameters if any
  }

  return {
    co2Grams: co2Grams.toFixed(2),
    cleanerThanPercentage,
    rating: getRating(co2Grams),
    isGreen: isGreen,
    imageAnalysis: imageAnalysis
  };
}

function getRating(co2Grams) {
  if (co2Grams < 2.0) return 'A';
  if (co2Grams < 3.2) return 'B';
  if (co2Grams < 4.4) return 'C';
  if (co2Grams < 5.6) return 'D';
  if (co2Grams < 6.8) return 'E';
  if (co2Grams < 8.0) return 'F';
  return 'G';
}


function waitForContentScript(tabId) {
  return new Promise((resolve) => {
    function checkContentScript() {
      chrome.tabs.sendMessage(tabId, {action: "ping"}, response => {
        if (chrome.runtime.lastError) {
          setTimeout(checkContentScript, 100); // Check again after 100ms
        } else {
          resolve();
        }
      });
    }
    checkContentScript();
  });
}

button.addEventListener('click', async () => {
  console.log('Button clicked');
  button.style.display = 'none'; // Hide the button
  loading.style.display = 'block';
  result.innerHTML = '';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('Current tab:', tab.url);
    const data = await predictCO2AndGreenStatus(tab.url);
    console.log('Prediction completed:', data);

    // Display the result
    result.innerHTML = `
      <p>&#128065; CO2: <strong>${data.co2Grams} grams</strong></p>
      <p>&#128200; Cleaner than: <strong>${data.cleanerThanPercentage}% of pages</strong></p>
      <p>&#11088; Rating: <strong>${data.rating}</strong></p>
      <p>&#127807; Green hosting: <strong>${data.isGreen ? 'Yes' : 'No'}</strong></p>
      <p>&#128200; Image analysis:</p>
      <ul>
        ${data.imageAnalysis.suggestions.map(suggestion => `<li><strong>${suggestion}</strong></li>`).join('')}
      </ul>
    `;
  } catch (error) {
    console.error('Error in main process:', error);
    result.innerHTML = 'An error occurred. Please try again.';
    button.style.display = 'block'; // Show the button again if there's an error
  } finally {
    loading.style.display = 'none';
  }
});

let infoModalVisible = false;

document.getElementById('info-icon').addEventListener('click', () => {
  const infoModal = document.getElementById('info-modal');
  infoModalVisible = !infoModalVisible;
  infoModal.style.display = infoModalVisible ? 'block' : 'none';
});

document.getElementById('info-modal').addEventListener('click', () => {
  infoModalVisible = false;
  document.getElementById('info-modal').style.display = 'none';
});

console.log('Popup script finished loading');
