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

// Write CSV headers
writeStream.write("id,name,phone,age\n");

// Initialize sax parser in strict mode
const parser = sax.createStream(true);

// Temporary storage for customer data
let currentCustomer = {};
let currentElement = null;

// Event when a new tag is opened
parser.on("opentag", (node) => {
  currentElement = node.name; // Set current element to the opening tag name
  if (node.name === "customer") {
    currentCustomer = {}; // Initialize a new customer object
  }
});

// Event when text is found inside a tag
parser.on("text", (text) => {
  text = text.trim(); // Remove any unnecessary whitespaces

  if (!currentElement || !text) return; // Skip if no element or empty text

  switch (currentElement) {
    case "id":
      currentCustomer.id = text;
      break;
    case "name":
      currentCustomer.name = text;
      break;
    case "phone":
      currentCustomer.phone = text;
      break;
    case "age":
      currentCustomer.age = parseInt(text, 10); // Convert age to an integer
      break;
  }
});

// Event when a closing tag is encountered
parser.on("closetag", (tagName) => {
  if (tagName === "customer") {
    // Check if the age is between 20 and 30
    if (currentCustomer.age >= 20 && currentCustomer.age <= 30) {
      // Write the filtered customer data to the CSV file
      writeStream.write(
        `${currentCustomer.id},${currentCustomer.name},${currentCustomer.phone},${currentCustomer.age}\n`
      );
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
  console.log("Parsing completed and file written to", outputFilePath);
  writeStream.end(); // Close the write stream
});

// Pipe the read stream into the parser
readStream.pipe(parser);
