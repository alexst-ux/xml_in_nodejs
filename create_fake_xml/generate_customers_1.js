const fs = require("fs");
const faker = require("faker");
const { create } = require("xmlbuilder2");

function createCustomer() {
  return {
    id: faker.datatype.number({ min: 10000000, max: 99999999 }),
    name: faker.name.findName(),
    phone: faker.phone.phoneNumber(),
    address:
      faker.address.streetAddress() +
      ", " +
      faker.address.city() +
      ", " +
      faker.address.country(),
    age: faker.datatype.number({ min: 20, max: 99 }),
  };
}

function customerToXml(customer) {
  const xml = create({ version: "1.0", encoding: "UTF-8" })
    .ele("customer")
    .ele("id")
    .txt(customer.id)
    .up()
    .ele("name")
    .txt(customer.name)
    .up()
    .ele("phone")
    .txt(customer.phone)
    .up()
    .ele("address")
    .txt(customer.address)
    .up()
    .ele("age")
    .txt(customer.age)
    .up()
    .end({ prettyPrint: true });

  return xml.substring(xml.indexOf("\n") + 1); // Remove the XML declaration
}

async function generateCustomers(filePath, targetSizeBytes) {
  const writeStream = fs.createWriteStream(filePath);

  writeStream.write('<?xml version="1.0" encoding="UTF-8"?>\n<customers>\n');

  let currentSize = 0;
  while (currentSize < targetSizeBytes) {
    const customer = createCustomer();
    const customerXml = customerToXml(customer);

    if (!writeStream.write(customerXml)) {
      await new Promise((resolve) => writeStream.once("drain", resolve));
    }

    currentSize = fs.statSync(filePath).size;

    if (currentSize >= targetSizeBytes) break;
  }

  writeStream.end("</customers>");

  return new Promise((resolve) => writeStream.on("finish", resolve));
}

const targetSize = 1_000_000_000; // 1GB in bytes

generateCustomers("large_customers.xml", targetSize)
  .then(() => console.log("XML file generation complete."))
  .catch((err) => console.error("Error generating XML:", err));
