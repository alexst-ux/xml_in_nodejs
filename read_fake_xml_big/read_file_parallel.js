const { Worker } = require("worker_threads");
const path = require("path");
const fs = require("fs");

// Path to the large XML file and output CSV
const inputFilePath = path.join(__dirname, "large_customers.xml");
const outputFilePath = path.join(__dirname, "output_prll_52.csv");

const workerRanges = [
  { start: 0, end: 2_250_000 },
  { start: 2_250_001, end: 4_500_000 },
  { start: 4_500_001, end: 6_750_000 },
  { start: 6_750_001, end: Infinity },
];

// Create a writable stream for the output CSV
const writeStream = fs.createWriteStream(outputFilePath);
writeStream.write("id,name,phone,age,email\n");

// Function to spawn workers and assign their ranges
function processFile() {
  workerRanges.forEach((range, index) => {
    const worker = new Worker("./worker.js", {
      workerData: {
        filePath: inputFilePath,
        startTag: range.start,
        endTag: range.end,
      },
    });

    worker.on("message", (filteredCustomers) => {
      // Write results from the worker to the CSV
      filteredCustomers.forEach((customer) => {
        const row = Object.values(customer).join(",");
        writeStream.write(row + "\n");
      });
    });

    worker.on("error", (err) => {
      console.error(`Worker ${index} encountered an error:`, err);
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        console.error(`Worker ${index} stopped with exit code ${code}`);
      } else {
        console.log(`Worker ${index} finished processing.`);
      }
    });
  });
}

processFile();
