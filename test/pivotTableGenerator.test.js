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
});
