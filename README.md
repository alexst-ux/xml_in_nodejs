# XML Reader/Writer Utilities on NodeJS

This project is an efficient XML parser designed to handle extremely large XML files, often several gigabytes in size. Built using the [sax](https://github.com/isaacs/sax-js) library, the tool can process XML data in a streaming manner, extracting specific information based on search criteria and outputting the results into a CSV file.

## Features

- **Stream-based Parsing**: The parser reads and processes XML data on the fly, minimizing memory consumption by not loading the entire XML file into RAM.
- **Multi-threaded Execution**: The application utilizes four worker threads, each responsible for processing a particular section of the XML file concurrently, significantly improving performance.
- **Large File Support**: Capable of handling XML files larger than 1GB without performance degradation.

## Performance

- **Memory-efficient**: By processing the XML in chunks and not requiring the whole file to be loaded into memory, the parser ensures low RAM usage even for massive files.
- **Fast Processing**: Processing a 1GB XML file takes approximately 1 minute (or less), depending on system resources and file complexity.

## Dependencies

- **sax**: A SAX-style XML parser for JavaScript.
- **worker_threads**: Built-in Node.js module for multithreading support.

## Usage

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-folder>

