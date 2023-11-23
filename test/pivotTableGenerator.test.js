// test/pivotTableGenerator.test.js

const { expect } = require('chai');
const { PivotTableGenerator } = require('../pivotTableGenerator.js');

describe('PivotTableGenerator', function() {
  describe('#getWeekNumber()', function() {
    it('should return week number 1 for January 1, 2023', function() {
      const generator = new PivotTableGenerator({});
      const date = new Date(2023, 0, 1); // January 1, 2023
      const weekNumber = generator.getWeekNumber(date);
      expect(weekNumber).to.equal(1); // 1st week of the year
    });

    it('should return week number 53 for December 31, 2023', function() {
      const generator = new PivotTableGenerator({});
      const date = new Date(2023, 11, 31); // December 31, 2023
      const weekNumber = generator.getWeekNumber(date);
      expect(weekNumber).to.equal(53); // 53rd week of the year
    });
    
    // 他の日付に対するテストも追加できます
    // ...
  });

  describe('#generateHeader()', function() {
    it('should generate the correct header with default options', function() {
      const generator = new PivotTableGenerator({});
      const header = generator.generateHeader();
      expect(header).to.deep.equal([["Row \\ Column"]]);
    });

    it('should include extra columns when specified', function() {
      const generator = new PivotTableGenerator({ extraColumns: [1, 2] });
      const header = generator.generateHeader();
      expect(header[0]).to.include.members(['Extra Col 1', 'Extra Col 2']);
    });
  });

  describe('#processData()', function() {
    it('should ignore non-numeric cell values and not produce NaN in the pivot table', function() {
      const sampleData = [
        ['Row', 'Column', 'Value'],
        ['A', '2023-01-01', '10'],
        ['A', '2023-01-02', 'not-a-number'],
        ['B', '2023-01-01', '20'],
        ['B', '2023-01-02', '30']
      ];

      const options = {
        rowDimension: 0,
        columnDimension: 1,
        valueDimension: 2,
        weeklyTotals: true,
        monthlyTotals: true
      };

      const generator = new PivotTableGenerator(options);
      generator.processData(sampleData);

      // Check if the value for 'A-2023-01-02' is ignored and not producing NaN
      expect(generator.pivotTable.values.get('A-2023-01-02')).to.be.undefined;

      // Check if weekly and monthly totals are not NaN
      expect(generator.pivotTable.weeklyTotals.get('week-1-A')).to.equal(10);
      expect(generator.pivotTable.monthlyTotals.get('month-1-A')).to.equal(10);
    });
  });

  describe('#processData() with output range specification', function() {
    const sampleData = [
      ['Row', 'Column', 'Value'],
      ['A', '2023-01-01', '10'],
      ['A', '2023-01-02', '20'],
      ['B', '2023-01-01', '30'],
      ['B', '2023-01-02', '40']
    ];
  
    it('should respect specified lower and upper bounds for output range', function() {
      const options = {
        rowDimension: 0,
        columnDimension: 1,
        valueDimension: 2,
        outputRangeLower: 1,
        outputRangeUpper: 2
      };
      const generator = new PivotTableGenerator(options);
      generator.processData(sampleData);
      expect(generator.pivotTable.values.size).to.equal(2);
      expect(generator.pivotTable.values.has('A-2023-01-02')).to.be.true;
      expect(generator.pivotTable.values.has('B-2023-01-02')).to.be.true;
    });
  
    it('should respect only lower bound if upper bound is not specified', function() {
      const options = {
        rowDimension: 0,
        columnDimension: 1,
        valueDimension: 2,
        outputRangeLower: 1
      };
      const generator = new PivotTableGenerator(options);
      generator.processData(sampleData);
      expect(generator.pivotTable.values.size).to.equal(3);
    });
  
    it('should respect only upper bound if lower bound is not specified', function() {
      const options = {
        rowDimension: 0,
        columnDimension: 1,
        valueDimension: 2,
        outputRangeUpper: 2
      };
      const generator = new PivotTableGenerator(options);
      generator.processData(sampleData);
      expect(generator.pivotTable.values.size).to.equal(3);
    });
  
    it('should include all columns if no output range is specified', function() {
      const options = {
        rowDimension: 0,
        columnDimension: 1,
        valueDimension: 2
      };
      const generator = new PivotTableGenerator(options);
      generator.processData(sampleData);
      expect(generator.pivotTable.values.size).to.equal(4);
    });
  });

  describe('#matchListProcessing()', function() {
    it('should correctly read from a match list file', function() {
      const generator = new PivotTableGenerator({ matchList: './test/matchListSample.txt' });
      expect(generator.options.matchList).to.equal('./test/matchListSample.txt');
    });

    it('should filter rows based on the match list', function() {
      const sampleData = [
        ['Row', 'Column', 'Value'],
        ['AAA', '2023-01-01', '10'],
        ['DDD', '2023-01-02', '15'],
        ['BBB', '2023-01-01', '20'],
        ['CCC', '2023-01-02', '30']
      ];
  
      const options = {
        rowDimension: 0,
        columnDimension: 1,
        valueDimension: 2,
        matchList: './test/matchListSample.txt'
      };
      
      const generator = new PivotTableGenerator(options);
      generator.processData(sampleData);

      // DDD is not in the match list, so it should be filtered out.
      expect(generator.pivotTable.values.has('DDD-2023-01-02')).to.be.false;
      expect(generator.pivotTable.values.has('AAA-2023-01-01')).to.be.true;
    });
  
    it('should include all rows when no match list is provided', function() {
      const sampleData = [
        ['Row', 'Column', 'Value'],
        ['AAA', '2023-01-01', '10'],
        ['DDD', '2023-01-02', '15'],
        ['BBB', '2023-01-01', '20'],
        ['CCC', '2023-01-02', '30']
      ];
  
      const options = {
        rowDimension: 0,
        columnDimension: 1,
        valueDimension: 2
      };
  
      const generator = new PivotTableGenerator(options);
      generator.processData(sampleData);

      // All rows should be included.
      expect(generator.pivotTable.values.has('AAA-2023-01-01')).to.be.true;
      expect(generator.pivotTable.values.has('DDD-2023-01-02')).to.be.true;
    });
  });
});
