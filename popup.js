import { CO2 } from './esm/co2.js';


const button = document.getElementById('click-me');
const loading = document.querySelector('.loading');
const result = document.getElementById('result');

async function predictCO2AndGreenStatus(url) {
  const emissions = new CO2({ model: "swd", version: 4 });

  // For this example, we'll use a placeholder value for bytes
  // In a real scenario, you'd need to determine the actual byte size of the webpage
  const bytes = 1000000; // 1 MB as an example

  const co2Grams = await emissions.perVisit(bytes);

  const averageCO2 = 1.76; // Update this value based on more recent data if available
  const cleanerThanPercentage = Math.max(0, Math.min(100, (1 - (co2Grams / averageCO2)) * 100)).toFixed(0);

  const rating = emissions.model.getRating(co2Grams);

  return {
    co2Grams: co2Grams.toFixed(2),
    cleanerThanPercentage,
    rating,
  };
}

button.addEventListener('click', async () => {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    let url = tabs[0].url;
    button.style.display = 'none';
    loading.style.display = 'flex';
    result.innerHTML = '';

    try {
      const prediction = await predictCO2AndGreenStatus(url);

      loading.style.display = 'none';

      result.innerHTML = `
        <p><strong>&#127981; CO2 Emissions: ${prediction.co2Grams}g per visit</strong></p>
        <p><strong>&#128202; Cleaner than ${prediction.cleanerThanPercentage}% of tested websites</strong></p>
        <p><strong>&#127942; Energy Efficiency Rating: ${prediction.rating}</strong></p>
      `;
      // Remove the Green Status line from the result HTML
    } catch (error) {
      console.error('Error in prediction:', error);
      result.innerHTML = "<p><strong>&#10060; Error analyzing page content.</strong></p>";
    }
  });
});
