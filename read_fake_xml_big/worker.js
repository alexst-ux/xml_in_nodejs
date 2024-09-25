const { workerData, parentPort } = require("worker_threads");
const fs = require("fs");
const sax = require("sax");

let noticed = false;
// Parse the XML stream
function parseXMLStream(filePath, startTag, endTag) {
  const stream = fs.createReadStream(filePath, { encoding: "utf8" });
  const parser = sax.parser(true); // Strict mode
  let currentCustomer = {};
  let currentElement = null;
  let customerCount = 0;
  const filteredCustomers = [];

  parser.onopentag = (node) => {
    currentElement = node.name;
    if (currentElement === "customer") {
      customerCount += 1;
      currentCustomer = {};
    }

    if (!noticed && customerCount > endTag) {
      console.log(
        "customerCount>endTag",
        customerCount,
        endTag,
        filteredCustomers.length
      );
      stream.close();
      noticed = true;
    }
  };

  parser.ontext = (text) => {
    // Check if the customer is within the assigned range
    if (customerCount >= startTag && customerCount <= endTag) {
      text = text.trim();
      if (text && currentElement) {
        currentCustomer[currentElement] = text;
      }
    }
  };

  parser.onclosetag = (tagName) => {
    if (tagName === "customer") {
      // Process only if within range
      if (customerCount >= startTag && customerCount <= endTag) {
        const age = parseInt(currentCustomer.age, 10);
        if (age >= 20 && age <= 30) {
          filteredCustomers.push(currentCustomer);
        }
      }
    }
  };

  function postMessage() {
    if (filteredCustomers.length > 0) {
      parentPort.postMessage(filteredCustomers);
      filteredCustomers.length = 0;
    }
  }

  stream.on("data", (chunk) => {
    parser.write(chunk);
  });

  stream.on("close", () => {
    console.log("Stream has been closed.");
    parser.end(); // Ensure parser is also ended
    postMessage(); // Send results back
  });

  stream.on("end", () => {
    parser.close();
    postMessage();
  });

  stream.on("error", (err) => {
    parentPort.postMessage([]);
    throw new Error(`Error reading file: ${err}`);
  });
}

// Start parsing the file based on worker data
parseXMLStream(workerData.filePath, workerData.startTag, workerData.endTag);
