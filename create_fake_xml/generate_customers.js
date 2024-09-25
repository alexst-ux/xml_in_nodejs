const fs = require("fs");
const faker = require("faker");

const writeStream = fs.createWriteStream("large_customers.xml");
const targetSize = 1_000_000_000; // 1GB in bytes
const batchSize = 1000; // Number of customers to write in each batch

let createdNumber = 0;
function createCustomer() {
  createdNumber++;

  return `<customer><id>${faker.datatype.number({
    min: 10000000,
    max: 99999999,
  })}</id><name>${faker.name.findName()}</name><phone>${faker.phone.phoneNumber()}</phone><age>${faker.datatype.number(
    { min: 20, max: 99 }
  )}</age></customer>`;
}

function writeBatch() {
  let batch = "";
  for (let i = 0; i < batchSize; i++) {
    batch += createCustomer();
  }
  return writeStream.write(batch);
}

async function generateCustomers() {
  writeStream.write('<?xml version="1.0" encoding="UTF-8"?><customers>');

  let currentSize = 0;
  while (currentSize < targetSize) {
    if (!writeBatch()) {
      await new Promise((resolve) => writeStream.once("drain", resolve));
    }
    currentSize = writeStream.bytesWritten;
  }

  writeStream.end("</customers>");

  return new Promise((resolve) => writeStream.on("finish", resolve));
}

console.time("XML Generation");
generateCustomers()
  .then(() => {
    console.timeEnd("XML Generation");
    console.log(
      `Generated ${writeStream.bytesWritten} bytes of XML data, created ${createdNumber} customers.`
    );
  })
  .catch((err) => console.error("Error generating XML:", err));
