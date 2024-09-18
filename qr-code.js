const QRCode = require("qrcode");
const fs = require("fs-extra");
const path = require("path");

// Configuration
const baseURL = "https://example.com/label/";
const outputDir = path.join(__dirname, "qr-codes");
const totalLabels = 10;
const batchSize = 1000;

// Ensure the output directory exists
fs.ensureDirSync(outputDir);

// Function to generate unique URLs
const generateURLs = (baseURL, total) => {
  const urls = [];
  for (let i = 1; i <= total; i++) {
    urls.push(`${baseURL}${i}`);
  }
  return urls;
};

// Function to generate QR codes
const generateQRCode = async (url, outputPath) => {
  try {
    await QRCode.toFile(outputPath, url, {
      type: "png",
      width: 300,
      margin: 2,
    });
    console.log(`Generated QR code for: ${url}`);
  } catch (error) {
    console.error(`Error generating QR code for ${url}:`, error);
  }
};

// Function to process a batch of URLs
const processBatch = async (urls, batchNumber) => {
  const batchPromises = urls.map((url, index) => {
    const fileName = `label_${batchNumber * batchSize + index + 1}.png`;
    const outputPath = path.join(outputDir, fileName);
    return generateQRCode(url, outputPath);
  });
  await Promise.all(batchPromises);
  console.log(`Processed batch ${batchNumber + 1}`);
};

// Main function to generate QR codes for all labels
const generateQRCodesForLabels = async () => {
  const urls = generateURLs(baseURL, totalLabels);
  const totalBatches = Math.ceil(totalLabels / batchSize);

  try {
    for (let batchNumber = 0; batchNumber < totalBatches; batchNumber++) {
      const start = batchNumber * batchSize;
      const end = Math.min(start + batchSize, totalLabels);
      const batch = urls.slice(start, end);
      await processBatch(batch, batchNumber);
    }
    console.log("All QR codes generated successfully.");
  } catch (error) {
    console.error("Error generating QR codes:", error);
  }
};

// Run the main function
generateQRCodesForLabels();
