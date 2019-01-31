import { assert } from 'chai';
import Constraints from '../../../src/modules/config/Constraints';

describe('config > Constraints', () => {
  describe('#Audio()', () => {
    it('should generate correct constraints object', () => {
      assert.deepEqual(Constraints.Audio(true), { audio: true });
      assert.deepEqual(Constraints.Audio(), { audio: true });
      assert.deepEqual(Constraints.Audio({ echoCancellation: true }), { audio: { echoCancellation: true } });
    });
  });

  describe('#Video()', () => {
    it('should generate correct constraints object', () => {
      assert.deepEqual(Constraints.Video(true), { video: true });
      assert.deepEqual(Constraints.Video(), { video: true });
      assert.deepEqual(Constraints.Video({ height: 1080 }), { video: { height: 1080 } });
    });
  });

  describe('#Screen()', () => {
    it('should generate correct constraints object', () => {
      assert.deepEqual(Constraints.Screen(true), { video: { mediaSource: { height: 1080, width: 1920 } } });
      assert.deepEqual(Constraints.Screen(), { video: { mediaSource: { height: 1080, width: 1920 } } });
      assert.deepEqual(Constraints.Screen({ viewportWidth: 1920 }), { video: { mediaSource: { height: 1080, width: 1920 }, viewportWidth: 1920 } });
    });
  });
});
