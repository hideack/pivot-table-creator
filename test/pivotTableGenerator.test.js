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
});
