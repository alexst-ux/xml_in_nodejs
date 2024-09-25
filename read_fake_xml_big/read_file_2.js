const sax = require("sax");
const path = require("path");
const { createReadStream, createWriteStream } = require("fs");

const inputFilePath = path.join(__dirname, "large_customers.xml");
const outputFilePath = path.join(__dirname, "output.csv");

async function processXML() {
  const writeStream = createWriteStream(outputFilePath);
  await writeStream.write("id,name,phone,age\n");

  const parser = sax.createStream(true, { lowercasetags: true, trim: true });

  let currentCustomer = {};
  let currentElement = null;
  const buffer = [];

  const elementHandlers = {
    id: (text) => (currentCustomer.id = text),
    name: (text) => (currentCustomer.name = text),
    phone: (text) => (currentCustomer.phone = text),
    age: (text) => (currentCustomer.age = parseInt(text, 10)),
  };

  parser.on("opentag", (node) => {
    currentElement = node.name;
    if (node.name === "customer") currentCustomer = {};
  });

  parser.on("text", (text) => {
    if (currentElement in elementHandlers) {
      elementHandlers[currentElement](text);
    }
  });

  parser.on("closetag", (tagName) => {
    if (
      tagName === "customer" &&
      currentCustomer.age >= 20 &&
      currentCustomer.age <= 30
    ) {
      buffer.push(
        `${currentCustomer.id},${currentCustomer.name},${currentCustomer.phone},${currentCustomer.age}\n`
      );
      if (buffer.length >= 10000) {
        writeStream.write(buffer.join(""));
        buffer.length = 0;
      }
    }
  });

  parser.on("error", (err) => {
    console.error("Error parsing XML:", err);
    parser.resume();
  });

  await new Promise((resolve, reject) => {
    parser.on("end", resolve);
    createReadStream(inputFilePath).pipe(parser);
  });

  if (buffer.length > 0) {
    await writeStream.write(buffer.join(""));
  }
  await writeStream.end();
  console.log("Parsing completed and file written to", outputFilePath);
}

processXML().catch(console.error);
