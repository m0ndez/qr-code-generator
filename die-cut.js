const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");
const fs = require("fs-extra");
const path = require("path");

const MOCK = [...Array(100).keys()].map(
  (i) => `SXE-${String(i + 1).padStart(4, "0")}`
);

// Configuration
const baseURL = "https://example.com/label/";
const outputDir = path.join(__dirname, "die-cuts");
const totalLabels = MOCK.length;
const labelsPerFile = 1000;
const qrCodeSize = 80; // Size of each QR code in the PDF
const margin = 6.5; // Margin between QR codes
const textHeight = 15; // Height allocated for the text below the QR code
const pageWidth = 612; // Width of the PDF page (8.5 inches)
const pageHeight = 792; // Height of the PDF page (11 inches)
const qrCodesPerRow = Math.floor((pageWidth - margin) / (qrCodeSize + margin));
const qrCodesPerColumn = Math.floor(
  (pageHeight - margin) / (qrCodeSize + margin + textHeight)
);

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
const generateQRCode = async (url) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(url, {
      type: "image/png",
      width: qrCodeSize,
      margin: 0,
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error(`Error generating QR code for ${url}:`, error);
    throw error;
  }
};

// Function to create a PDF with QR codes
const createPDF = async (urls, fileName) => {
  const doc = new PDFDocument({ autoFirstPage: false });
  const outputPath = path.join(outputDir, fileName);
  const writeStream = fs.createWriteStream(outputPath);
  doc.pipe(writeStream);

  try {
    for (let i = 0; i < urls.length; i++) {
      const qrCodeDataURL = await generateQRCode(urls[i]);
      if (i % (qrCodesPerRow * qrCodesPerColumn) === 0) {
        doc.addPage({ size: [pageWidth, pageHeight] });
      }
      const x = (i % qrCodesPerRow) * (qrCodeSize + margin) + margin;
      const y =
        Math.floor((i % (qrCodesPerRow * qrCodesPerColumn)) / qrCodesPerRow) *
          (qrCodeSize + margin + textHeight) +
        margin;
      doc.image(qrCodeDataURL, x, y, {
        width: qrCodeSize,
        height: qrCodeSize,
        align: "center",
      });
      // Add custom text (serial number) below the QR code
      const textX = x;
      const textY = y + qrCodeSize + 5; // Adjust the 5 to add some margin between QR code and text
      doc.fontSize(8).text(MOCK[i], textX, textY, {
        width: qrCodeSize,
        align: "center",
      });

      // Log progress
      console.log(`Added QR code ${i + 1} of ${urls.length}`);
    }

    doc.end();
    writeStream.on("finish", () => {
      console.log(`Generated PDF: ${outputPath}`);
    });
  } catch (error) {
    console.error(`Error creating PDF ${fileName}:`, error);
    doc.end();
    throw error;
  }
};

// Main function to generate QR codes and combine them into PDFs
const generateQRCodesForLabels = async () => {
  const urls = generateURLs(baseURL, totalLabels);
  const totalFiles = Math.ceil(totalLabels / labelsPerFile);

  for (let fileNumber = 0; fileNumber < totalFiles; fileNumber++) {
    const start = fileNumber * labelsPerFile;
    const end = Math.min(start + labelsPerFile, totalLabels);
    const batch = urls.slice(start, end);
    const fileName = `qr_codes_${fileNumber + 1}.pdf`;
    await createPDF(batch, fileName);
  }

  console.log("All QR codes generated and saved to PDF files successfully.");
};

// Run the main function
generateQRCodesForLabels();
