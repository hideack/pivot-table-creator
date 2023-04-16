# Pivot-table-creator

This script generates a pivot table from a CSV file, with support for additional columns, row totals, and command line options. It is designed for large datasets and is memory-efficient.

## Usage

1. Install the required dependencies:

## npm install

2. Run the script with the desired options:

$ node index.js -- [options]

## Available options:

- -i, --input <inputFile>: Input CSV file path (default: "input.csv")
- -o, --output <outputFile>: Output CSV file path (default: "output.csv")
- -r, --rowDimension <rowIndex>: Row dimension column index (default: 0)
- -c, --columnDimension <columnIndex>: Column dimension column index (default: 1)
- -v, --valueDimension <valueIndex>: Value dimension column index (default: 2)
- -e, --extraColumns <columnIndexes>: Additional column indexes to be included (default: "")
- --rowTotals: Include row totals in the output (default: false)

## License

This project is licensed under the MIT License.