module.exports = main;

async function main() {
  const fs = require('fs');
  const Papa = require('papaparse');
  const { program } = require('commander');

  // Define command-line options and parse them
  program
    .option('-i, --input <inputFile>', 'Input CSV file path', 'input.csv')
    .option('-o, --output <outputFile>', 'Output CSV file path', 'output.csv')
    .option('-r, --rowDimension <rowIndex>', 'Row dimension column index', 0)
    .option('-c, --columnDimension <columnIndex>', 'Column dimension column index', 1)
    .option('-v, --valueDimension <valueIndex>', 'Value dimension column index', 2)
    .option('-e, --extraColumns <columnIndexes>', 'Additional column indexes to be included', '')
    .option('--rowTotals', 'Include row totals in the output', false)
    .option('--skipZeroTotals', 'Skip rows with zero totals in the output', false)
    .parse();

  const options = program.opts();

  console.log(`Input file: ${options.input}`);
  console.log(`Output file: ${options.output}`);

  // Set input and output file paths
  const inputFilePath = options.input;
  const outputFilePath = options.output;

  // Set column indexes for row, column, and value dimensions
  const rowDimension = parseInt(options.rowDimension);
  const columnDimension = parseInt(options.columnDimension);
  const valueDimension = parseInt(options.valueDimension);

  // Parse extra column indexes
  const extraColumns = options.extraColumns.split(',').filter(x => x !== '').map(x => parseInt(x));

  // Read data from the CSV file
  console.log('Reading CSV file...');
  const fileContent = fs.readFileSync(inputFilePath, 'utf8');
  const data = Papa.parse(fileContent, { header: false, skipEmptyLines: true }).data;

  // Define the pivot table structure
  const pivotTable = {
    rows: new Set(),
    columns: new Set(),
    values: new Map(),
    extraInfo: new Map(),
  };

  // Process data to create the pivot table
  for (let i = 1; i < data.length; i++) {
    const rowValue = data[i][rowDimension];
    const columnValue = data[i][columnDimension];
    const cellValue = parseFloat(data[i][valueDimension]);

    pivotTable.rows.add(rowValue);
    pivotTable.columns.add(columnValue);

    const key = `${rowValue}-${columnValue}`;
    if (!pivotTable.values.has(key)) {
      pivotTable.values.set(key, cellValue);
    } else {
      pivotTable.values.set(key, pivotTable.values.get(key) + cellValue);
    }

    // Store extra column information
    if (extraColumns.length > 0) {
      const extraInfoKey = rowValue;
      if (!pivotTable.extraInfo.has(extraInfoKey)) {
        const extraInfo = extraColumns.map(col => data[i][col]);
        pivotTable.extraInfo.set(extraInfoKey, extraInfo);
      }
    }
  }

  // Render the pivot table header
  const rows = Array.from(pivotTable.rows).sort();
  const columns = Array.from(pivotTable.columns).sort();
  const header = [["Row \\ Column", ...extraColumns.map(col => `Extra Col ${col}`), ...columns]];

  if (options.rowTotals) {
    header[0].push('Row Total');
  }

  const csvHeader = Papa.unparse(header);

  // Write the pivot table header to the output file
  console.log('Writing CSV header...');
  fs.writeFileSync(outputFilePath, csvHeader + '\n');

  // Render the pivot table body and write it to the output file
  const startTime = performance.now();
  console.log('Writing CSV body...');

  for (const rowValue of rows) {
    const row = [rowValue];
    
    // Add extra column information
    if (pivotTable.extraInfo.has(rowValue)) {
      row.push(...pivotTable.extraInfo.get(rowValue));
    }

    let rowTotal = 0;

    // Add cell values
    for (const columnValue of columns) {
      const key = `${rowValue}-${columnValue}`;
      if (pivotTable.values.has(key)) {
        const cellValue = pivotTable.values.get(key);
        row.push(cellValue);
        rowTotal += cellValue;
      } else {
        row.push('');
      }
    }

    if (options.rowTotals) {
      row.push(rowTotal);
    }

    if (!options.skipZeroTotals || rowTotal !== 0) {
      const csvRow = Papa.unparse([row]);
      fs.appendFileSync(outputFilePath, csvRow + '\n');
    }
  }

  const endTime = performance.now();
  console.log(`Pivot table created successfully. Time taken: ${endTime - startTime} ms.`);
}
