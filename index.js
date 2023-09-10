module.exports = main;

const fs = require('fs');
const Papa = require('papaparse');
const { program } = require('commander');

async function main() {
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
    .option('--weeklyTotals', 'Include weekly totals in the output', false)
    .option('--monthlyTotals', 'Include monthly totals in the output', false)
    .option('--minRowTotal <minRowTotal>', 'Minimum row total for inclusion in the output', null)
    .option('--maxRowTotal <maxRowTotal>', 'Maximum row total for inclusion in the output', null)
    .option('--omitBody', 'Omit the body of the pivot table and only include totals', false)
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

  // 
  const minRowTotal = options.minRowTotal !== null ? parseFloat(options.minRowTotal) : null;
  const maxRowTotal = options.maxRowTotal !== null ? parseFloat(options.maxRowTotal) : null;

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
    weeklyTotals: new Map(),
    monthlyTotals: new Map(),
    extraInfo: new Map(),
  };

  function getWeekNumber(date) {
    const startOfYear = new Date(date.getFullYear(), 0, 1); // 1月1日
    const daysPassed = (date - startOfYear) / (24 * 60 * 60 * 1000);
    return Math.ceil((daysPassed + (startOfYear.getDay() === 0 ? 0 : 7 - startOfYear.getDay())) / 7);
  }

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

    if (options.weeklyTotals || options.monthlyTotals) {
      const date = new Date(data[i][columnDimension]);
      const weekNumber = getWeekNumber(date);
      const month = date.getMonth() + 1;

      if (options.weeklyTotals) {
        const weeklyTotalKey = `week-${weekNumber}-${rowValue}`;
        pivotTable.weeklyTotals.set(weeklyTotalKey, (pivotTable.weeklyTotals.get(weeklyTotalKey) || 0) + cellValue);
      }

      if (options.monthlyTotals) {
        const monthlyTotalKey = `month-${month}-${rowValue}`;
        pivotTable.monthlyTotals.set(monthlyTotalKey, (pivotTable.monthlyTotals.get(monthlyTotalKey) || 0) + cellValue);
      }
    }
  }

  const rows = Array.from(pivotTable.rows).sort();
  const columns = Array.from(pivotTable.columns).sort();

  // Existing header definition
  const header = [["Row \\ Column"]];

  // Always add extra column headers
  header[0].push(...extraColumns.map(col => `Extra Col ${col}`));

  // Add main column headers only if omitBody is not set
  if (!options.omitBody) {
    header[0].push(...columns);
  }

  if (options.rowTotals) {
    header[0].push('Row Total');
  }

  if (options.weeklyTotals) {
    for (let week = 1; week <= 52; week++) { // Assuming maximum 52 weeks in a year
      header[0].push(`Week ${week} Total`);
    }
  }

  if (options.monthlyTotals) {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    for (const month of months) {
      header[0].push(`${month} Total`);
    }
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

    // Calculate rowTotal regardless of whether the body is omitted
    for (const columnValue of columns) {
      const key = `${rowValue}-${columnValue}`;
      if (pivotTable.values.has(key)) {
        const cellValue = pivotTable.values.get(key);
        rowTotal += cellValue;
      }
    }

    if (!options.omitBody) {
      // Existing logic to write the body
      for (const columnValue of columns) {
        const key = `${rowValue}-${columnValue}`;
        if (pivotTable.values.has(key)) {
          const cellValue = pivotTable.values.get(key);
          row.push(cellValue);
        } else {
          row.push('');
        }
      }
    }

    if (options.rowTotals) {
      row.push(rowTotal);
    }

    // Check if the row total is within the specified range
    const withinRange = (minRowTotal === null || rowTotal >= minRowTotal) && (maxRowTotal === null || rowTotal <= maxRowTotal);

    if (options.weeklyTotals) {
      for (let week = 1; week <= 52; week++) {
        const weeklyTotalKey = `week-${week}-${rowValue}`;
        row.push(pivotTable.weeklyTotals.get(weeklyTotalKey) || '');
      }
    }

    if (options.monthlyTotals) {
      for (let month = 1; month <= 12; month++) {
        const monthlyTotalKey = `month-${month}-${rowValue}`;
        row.push(pivotTable.monthlyTotals.get(monthlyTotalKey) || '');
      }
    }

    if ((!options.skipZeroTotals || rowTotal !== 0) && withinRange) {
      const csvRow = Papa.unparse([row]);
      fs.appendFileSync(outputFilePath, csvRow + '\n');
    }
  }

  const endTime = performance.now();
  console.log(`Pivot table created successfully. Time taken: ${endTime - startTime} ms.`);
}
