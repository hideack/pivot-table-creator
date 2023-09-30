# Pivot-table-creator

This script generates a pivot table from a CSV file. It provides features like filtering rows based on a match list, supports additional columns, row totals, weekly and monthly totals, and offers various command line options including the ability to omit the main body of the pivot table. It is designed for large datasets and is memory-efficient.

## Usage

1. Install the required dependencies:
    ```sh
    npm install
    ```

2. Run the script with the desired options:
    ```sh
    node index.js -- [options]
    ```

## Available options:

- `-i, --input <inputFile>`: Input CSV file path (default: "input.csv")
- `-o, --output <outputFile>`: Output CSV file path (default: "output.csv")
- `-r, --rowDimension <rowIndex>`: Row dimension column index (default: 0)
- `-c, --columnDimension <columnIndex>`: Column dimension column index (default: 1)
- `-v, --valueDimension <valueIndex>`: Value dimension column index (default: 2)
- `-e, --extraColumns <columnIndexes>`: Additional column indexes to be included (default: "")
- `--rowTotals`: Include row totals in the output (default: false)
- `--minRowTotal <minRowTotal>`: Minimum row total for inclusion in the output (default: null)
- `--maxRowTotal <maxRowTotal>`: Maximum row total for inclusion in the output (default: null)
- `--weeklyTotals`: Include weekly totals in the output based on the USA calendar system where weeks start on Sunday (default: false)
- `--monthlyTotals`: Include monthly totals in the output (default: false)
- `--omitBody`: Omit the main body of the pivot table and include only the totals (default: false)
- `--matchListFile <matchListFile>`: Path to the file containing the list of rows to be included in the pivot table. Each row in this file represents a string to be matched in the input data (default: null).

## License

This project is licensed under the MIT License.
