const fs = require('fs');
const Papa = require('papaparse');

class PivotTableGenerator {
  constructor(options) {
    this.options = options;
    this.pivotTable = {
      rows: new Set(),
      columns: new Set(),
      values: new Map(),
      weeklyTotals: new Map(),
      monthlyTotals: new Map(),
      extraInfo: new Map(),
    };
  }

  getWeekNumber(date) {
    // 1月4日を基準として、その週を第1週とする
    const jan4 = new Date(date.getFullYear(), 0, 4);
    const daysSinceJan4 = Math.round((date - jan4) / (24 * 60 * 60 * 1000));
    return Math.ceil((daysSinceJan4 + jan4.getDay() + 1) / 7);
  }

  processData(data) {
    for (let i = 1; i < data.length; i++) {
      const rowValue = data[i][this.options.rowDimension];
      const columnValue = data[i][this.options.columnDimension];
      const cellValue = parseFloat(data[i][this.options.valueDimension]);

      this.pivotTable.rows.add(rowValue);
      this.pivotTable.columns.add(columnValue);

      const key = `${rowValue}-${columnValue}`;
      if (!this.pivotTable.values.has(key)) {
        this.pivotTable.values.set(key, cellValue);
      } else {
        this.pivotTable.values.set(key, this.pivotTable.values.get(key) + cellValue);
      }

      if (this.options.extraColumns.length > 0) {
        const extraInfoKey = rowValue;
        if (!this.pivotTable.extraInfo.has(extraInfoKey)) {
          const extraInfo = this.options.extraColumns.map(col => data[i][col]);
          this.pivotTable.extraInfo.set(extraInfoKey, extraInfo);
        }
      }

      if (this.options.weeklyTotals || this.options.monthlyTotals) {
        const date = new Date(data[i][this.options.columnDimension]);
        const weekNumber = this.getWeekNumber(date);
        const month = date.getMonth() + 1;

        if (this.options.weeklyTotals) {
          const weeklyTotalKey = `week-${weekNumber}-${rowValue}`;
          this.pivotTable.weeklyTotals.set(weeklyTotalKey, (this.pivotTable.weeklyTotals.get(weeklyTotalKey) || 0) + cellValue);
        }

        if (this.options.monthlyTotals) {
          const monthlyTotalKey = `month-${month}-${rowValue}`;
          this.pivotTable.monthlyTotals.set(monthlyTotalKey, (this.pivotTable.monthlyTotals.get(monthlyTotalKey) || 0) + cellValue);
        }
      }
    }
  }

  generateHeader() {
    const header = [["Row \\ Column"]];
    header[0].push(...this.options.extraColumns.map(col => `Extra Col ${col}`));
    if (!this.options.omitBody) {
      header[0].push(...Array.from(this.pivotTable.columns).sort());
    }
    if (this.options.rowTotals) {
      header[0].push('Row Total');
    }
    if (this.options.weeklyTotals) {
      for (let week = 1; week <= 52; week++) {
        header[0].push(`Week ${week} Total`);
      }
    }
    if (this.options.monthlyTotals) {
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      for (const month of months) {
        header[0].push(`${month} Total`);
      }
    }
    return header;
  }

  generateBody() {
    const rows = Array.from(this.pivotTable.rows).sort();
    const columns = Array.from(this.pivotTable.columns).sort();
    const body = [];

    for (const rowValue of rows) {
      const row = [rowValue];
      if (this.pivotTable.extraInfo.has(rowValue)) {
        row.push(...this.pivotTable.extraInfo.get(rowValue));
      }

      let rowTotal = 0;
      for (const columnValue of columns) {
        const key = `${rowValue}-${columnValue}`;
        if (this.pivotTable.values.has(key)) {
          const cellValue = this.pivotTable.values.get(key);
          rowTotal += cellValue;
        }
      }

      if (!this.options.omitBody) {
        for (const columnValue of columns) {
          const key = `${rowValue}-${columnValue}`;
          if (this.pivotTable.values.has(key)) {
            const cellValue = this.pivotTable.values.get(key);
            row.push(cellValue);
          } else {
            row.push('');
          }
        }
      }

      if (this.options.rowTotals) {
        row.push(rowTotal);
      }

      const withinRange = (this.options.minRowTotal === null || rowTotal >= this.options.minRowTotal) && (this.options.maxRowTotal === null || rowTotal <= this.options.maxRowTotal);

      if (this.options.weeklyTotals) {
        for (let week = 1; week <= 52; week++) {
          const weeklyTotalKey = `week-${week}-${rowValue}`;
          row.push(this.pivotTable.weeklyTotals.get(weeklyTotalKey) || '');
        }
      }

      if (this.options.monthlyTotals) {
        for (let month = 1; month <= 12; month++) {
          const monthlyTotalKey = `month-${month}-${rowValue}`;
          row.push(this.pivotTable.monthlyTotals.get(monthlyTotalKey) || '');
        }
      }

      if ((!this.options.skipZeroTotals || rowTotal !== 0) && withinRange) {
        body.push(row);
      }
    }
    return body;
  }
}

function generatePivotTable(options) {
  console.log(`Input file: ${options.input}`);
  console.log(`Output file: ${options.output}`);

  const startTime = Date.now();

  const fileContent = fs.readFileSync(options.input, 'utf8');
  const data = Papa.parse(fileContent, { header: false, skipEmptyLines: true }).data;

  const pivotTableGenerator = new PivotTableGenerator(options);
  pivotTableGenerator.processData(data);

  const header = pivotTableGenerator.generateHeader();
  const body = pivotTableGenerator.generateBody();

  const csvHeader = Papa.unparse(header);
  const csvBody = Papa.unparse(body);

  fs.writeFileSync(options.output, csvHeader + '\n' + csvBody);

  const endTime = Date.now();
  const elapsedTime = endTime - startTime;

  console.log(`Pivot table created successfully. Time taken: ${elapsedTime} ms.`);
}

module.exports = {
  generatePivotTable,
  PivotTableGenerator
};