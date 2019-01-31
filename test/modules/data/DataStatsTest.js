import { assert } from 'chai';
import DataStats from '../../../src/modules/data/DataStats';

const fileSize = 1800;
const chunkNumber = 20;
const dataStats = new DataStats(fileSize, chunkNumber);

describe('data > DataStats', () => {
  describe('#constructor()', () => {
    it('should create a correct object', () => {
      assert.equal(dataStats.fileSize, fileSize);
      assert.equal(dataStats.chunkNumber, chunkNumber);
    });
  });

  describe('#update()', () => {
    it('should correctly update statistics', () => {
      dataStats.update(150, 10, 1);
      assert.equal(dataStats.fileSize, fileSize);
      assert.equal(dataStats.chunkNumber, chunkNumber);
      assert.equal(dataStats.currentChunk, 1);
      assert.equal(dataStats.percent, '8');
      assert.equal(dataStats.maxSpeed, 120);
      assert.equal(dataStats.currentSpeed, 120);
    });

    it('should correctly calculate current and max speed', () => {
      dataStats.update(175, 12, 2);
      assert.equal(dataStats.percent, '18');
      assert.equal(dataStats.maxSpeed, 120);
      assert.equal(dataStats.currentSpeed, 17);
    });
  });
});
