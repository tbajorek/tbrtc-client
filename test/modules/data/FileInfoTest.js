import { assert } from 'chai';
import FileInfo from '../../../src/modules/data/FileInfo';

const fileId = '12a';
const file = {
  name: 'filename',
  size: 123,
  lastModifiedDate: '15-01-2019',
  type: 'txt',
};
const fileInfo = new FileInfo(file, fileId);

describe('data > FileInfo', () => {
  describe('#constructor()', () => {
    it('should create a correct object', () => {
      assert.equal(fileInfo.name, file.name);
      assert.equal(fileInfo.size, file.size);
      assert.equal(fileInfo.lastModifiedDate, file.lastModifiedDate);
      assert.equal(fileInfo.type, file.type);
      assert.equal(fileInfo.fileId, fileId);
    });
  });

  describe('#compare()', () => {
    it('should compare two same object', () => {
      const fileInfo2 = new FileInfo(file, fileId);
      assert.deepEqual(fileInfo, fileInfo2);
    });

    it('should compare two different object', () => {
      const file2 = file;
      file2.name = 'new_name';
      const fileInfo3 = new FileInfo(file2, fileId);
      assert.notDeepEqual(fileInfo, fileInfo3);
    });
  });
});
