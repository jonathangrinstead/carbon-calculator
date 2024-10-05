import { CO2 } from './esm/co2.js';

const button = document.getElementById('click-me');
const loading = document.querySelector('.loading');
const result = document.getElementById('result');

async function predictCO2AndGreenStatus(url) {
  const emissions = new CO2({ model: "swd", version: 4 });

  // Function to get the byte size of the webpage
  async function getWebpageSize(url) {
    try {
      const response = await fetch(url);
      const text = await response.text();
      const bytes = new Blob([text]).size;
      return bytes;
    } catch (error) {
      console.error('Error fetching webpage:', error);
      return 0;
    }
  }

  // Get the actual byte size of the webpage
  const bytes = await getWebpageSize(url);

  const co2Result = await emissions.perVisit(bytes);
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

  const averageCO2 = 1.76; // Update this value based on more recent data if available
  const cleanerThanPercentage = Math.max(0, Math.min(100, (1 - (co2Grams / averageCO2)) * 100)).toFixed(0);

  return {
    co2Grams: co2Grams.toFixed(2),
    cleanerThanPercentage,
    rating: getRating(co2Grams),
    isGreen: isGreen,
  };
}

function getRating(co2Grams) {
  if (co2Grams < 0.4) return 'A';
  if (co2Grams < 0.8) return 'B';
  if (co2Grams < 1.2) return 'C';
  if (co2Grams < 1.6) return 'D';
  return 'E';
}

button.addEventListener('click', async () => {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    let url = tabs[0].url;
    button.style.display = 'none';
    loading.style.display = 'flex';
    result.innerHTML = '';

    try {
      const prediction = await predictCO2AndGreenStatus(url);

      console.log(prediction.isGreen)

      loading.style.display = 'none';

      result.innerHTML = `
        ${prediction.isGreen ? '<p><strong>&#9989; This website is green!</strong></p>' : '<p><strong>&#10060; This website is not green.</strong></p>'}
        <p><strong>&#127981; CO2 Emissions: ${prediction.co2Grams}g per visit</strong></p>
        <p><strong>&#128202; Cleaner than ${prediction.cleanerThanPercentage}% of tested websites</strong></p>
        <p><strong>&#127942; Energy Efficiency Rating: ${prediction.rating}</strong></p>
      `;
    } catch (error) {
      console.error('Error in prediction:', error);
      result.innerHTML = "<p><strong>&#10060; Error analyzing page content.</strong></p>";
    }
  });
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
