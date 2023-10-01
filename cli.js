const { program } = require('commander');
const { generatePivotTable } = require('./pivotTableGenerator');

function parseOptions() {
  program
    .option('-i, --input <inputFile>', 'Input CSV file path (required)')
    .option('-o, --output <outputFile>', 'Output CSV file path', 'output.csv')
    .option('-r, --rowDimension <rowIndex>', 'Row dimension column index (required)')
    .option('-c, --columnDimension <columnIndex>', 'Column dimension column index (required)')
    .option('-v, --valueDimension <valueIndex>', 'Value dimension column index (required)')
    .option('-e, --extraColumns <columnIndexes>', 'Additional column indexes to be included', '')
    .option('--rowTotals', 'Include row totals in the output', false)
    .option('--skipZeroTotals', 'Skip rows with zero totals in the output', false)
    .option('--weeklyTotals', 'Include weekly totals in the output', false)
    .option('--monthlyTotals', 'Include monthly totals in the output', false)
    .option('--minRowTotal <minRowTotal>', 'Minimum row total for inclusion in the output', null)
    .option('--maxRowTotal <maxRowTotal>', 'Maximum row total for inclusion in the output', null)
    .option('--omitBody', 'Omit the body of the pivot table and only include totals', false)
    .option('-m, --matchList <matchFile>', 'Text file containing strings for row filtering', null)
    .parse();

  if (!program.input || typeof program.rowDimension === 'undefined' || typeof program.columnDimension === 'undefined' || typeof program.valueDimension === 'undefined') {
    program.help();
  }

  const options = program.opts();
  options.rowDimension = parseInt(options.rowDimension);
  options.columnDimension = parseInt(options.columnDimension);
  options.valueDimension = parseInt(options.valueDimension);
  options.minRowTotal = options.minRowTotal !== null ? parseFloat(options.minRowTotal) : null;
  options.maxRowTotal = options.maxRowTotal !== null ? parseFloat(options.maxRowTotal) : null;
  options.extraColumns = options.extraColumns.split(',').filter(x => x !== '').map(x => parseInt(x));
  return options;
}

function main() {
  const options = parseOptions();
  generatePivotTable(options);
}

main();
