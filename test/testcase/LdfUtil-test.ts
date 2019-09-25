import * as fse from "fs-extra";
import * as nock from 'nock';
import * as Path from 'path';
import {LdfUtil} from "../../lib/LdfUtil";

describe('LdfUtil', () => {
  const fileUrl = "https://comunica.github.io/ontology-query-testing/ontology-query-testing.ttl#File";
  const tpfUrl = "https://comunica.github.io/ontology-query-testing/ontology-query-testing.ttl#TPF";
  const notSupportedUrl = "https://comunica.github.io/ontology-query-testing/ontology-query-testing.ttl/NSU";
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

  describe('#fetchFile', () => {

    it('should correctly fetch a file', async () => {
      nock('http://md.bu')
      .get('/file.ttl')
      .reply(200, `fetch test`);

      const filename = await LdfUtil.fetchFile(Path.join('test', 'testcase', 'tempfiles'),
        { value: 'http://md.bu/file.ttl', type: '' });
      expect(filename).toEqual('file.ttl');
      fse.removeSync(Path.join(process.cwd(), 'test', 'testcase', 'tempfiles', 'file.ttl'));
    });

  });

});
