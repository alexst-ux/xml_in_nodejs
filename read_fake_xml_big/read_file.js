const fs = require("fs");
const sax = require("sax");
const path = require("path");

// Create read and write streams
const inputFilePath = path.join(__dirname, "large_customers.xml");
const outputFilePath = path.join(__dirname, "output.csv");

// Create a readable stream for the XML file
const readStream = fs.createReadStream(inputFilePath, "utf8");

// Create a writable stream for the output CSV file
const writeStream = fs.createWriteStream(outputFilePath);

// Storage for dynamically collected field names (for CSV headers)
let headers = new Set();
let headersWritten = false;

// Temporary storage for customer data
let currentCustomer = {};
let currentElement = null;

const buffer = [];

// Initialize sax parser in strict mode
const parser = sax.createStream(true);

// Event when a new tag is opened
parser.on("opentag", (node) => {
  currentElement = node.name; // Set current element to the opening tag name
  if (node.name === "customer") {
    currentCustomer = {}; // Initialize a new customer object
  }
});

// Event when text is found inside a tag
parser.on("text", (text) => {
  text = text.trim(); // Remove any unnecessary whitespace

  if (!currentElement || !text) return; // Skip if no element or empty text

  // Dynamically collect field names and values for the current customer
  currentCustomer[currentElement] = text;

  // Add the current element name to headers (if not already present)
  headers.add(currentElement);
});

// Event when a closing tag is encountered
parser.on("closetag", (tagName) => {
  if (tagName === "customer") {
    // Check if the age is between 20 and 30 (assuming 'age' is always a number)
    const age = parseInt(currentCustomer.age, 10);
    if (age >= 20 && age <= 30) {
      // Dynamically write headers only once
      if (!headersWritten) {
        writeStream.write(Array.from(headers).join(",") + "\n");
        headersWritten = true;
      }

      // Write customer data dynamically based on the available headers
      buffer.push(
        Array.from(headers)
          .map((header) => currentCustomer[header] || "")
          .join(",") + "\n"
      );
      if (buffer.length >= 1000) {
        writeStream.write(buffer.join(""));
        buffer.length = 0;
      }
    }
    currentCustomer = {}; // Reset customer object after processing
  }
});

// Handle errors
parser.on("error", (err) => {
  console.error("Error parsing XML:", err);
  parser.resume(); // Continue parsing in case of error
});

// Event when the parsing is finished
parser.on("end", () => {
  if (buffer.length > 0) {
    writeStream.write(buffer.join(""));
    buffer.length = 0;
  }
  writeStream.end(); // Close the write stream
  console.log("Parsing completed and file written to", outputFilePath);
});

// Pipe the read stream into the parser
readStream.pipe(parser);
