import { LdfUtil } from "../../lib/LdfUtil";

describe('LdfUtil', () => {
  const fileUrl = "https://manudebuck.github.io/engine-ontology/engine-ontology.ttl#File";
  const tpfUrl = "https://manudebuck.github.io/engine-ontology/engine-ontology.ttl#TPF";
  const notSupportedUrl = "https://manudebuck.github.io/engine-ontology/engine-ontology.ttl/NSU";
  const tmpDir = 'test/testcase/tempfiles';

  describe('#removePrefix', () => {
    it('should remove the prefix', () => {
      expect(LdfUtil.removePrefix(fileUrl)).toEqual('File');
      expect(LdfUtil.removePrefix(tpfUrl)).toEqual('TPF');
    });

    it(`shouldn't remove anything`, () => {
      expect(LdfUtil.removePrefix(notSupportedUrl)).toEqual(notSupportedUrl);
    });
  });

  describe('#getHttpSClient', () => {
    it('should return http clients', () => {
      expect(LdfUtil.getHttpSClient('http:')).toEqual(require('http'));
      expect(LdfUtil.getHttpSClient('https:')).toEqual(require('https'));
    });
  });

});
