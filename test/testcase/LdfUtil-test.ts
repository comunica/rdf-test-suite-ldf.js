import * as fs from 'fs';
import * as nock from 'nock';
import * as Path from 'path';
import { Util } from "rdf-test-suite";
import { LdfUtil } from "../../lib/LdfUtil";

describe('LdfUtil', () => {
  const fileUrl = "https://manudebuck.github.io/query-testing-ontology/query-testing-ontology.ttl#File";
  const tpfUrl = "https://manudebuck.github.io/query-testing-ontology/query-testing-ontology.ttl#TPF";
  const notSupportedUrl = "https://manudebuck.github.io/query-testing-ontology/query-testing-ontology.ttl/NSU";
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

  describe('#fetchFile', () => {

    it('should correctly fetch a file', async () => {
      nock('http://md.bu')
      .get('/file.ttl')
      .reply(200, `fetch test`);

      const filename = await LdfUtil.fetchFile(Path.join('test', 'testcase', 'tempfiles'),
        { value: 'http://md.bu/file.ttl', type: '' });
      expect(filename).toEqual('file.ttl');

    });

  });

});
