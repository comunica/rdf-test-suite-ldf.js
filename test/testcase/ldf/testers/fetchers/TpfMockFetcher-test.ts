import { LdfTestCaseEvaluation, ILdfTestaseEvaluationProps } from "../../../../../lib/testcase/ldf/LdfTestCaseEvaluationHandler";
import { ITestCaseData } from "rdf-test-suite";
import { TpfMockFetcher, IMockedResponse } from "../../../../../lib/testcase/ldf/testers/fetchers/TpfMockFetcher";
const nock = require('nock');

const streamifyString = require('streamify-string');

describe('TpfMockFetcher', () => {

  let requestedURI: string = 'http://ex.org/';

  let testCaseData: ITestCaseData = {
    uri: "",
    types: ["", ""],
    name: "",
    comment: "",
    approval: "",
    approvedBy: "",
  };
  let props: ILdfTestaseEvaluationProps = {
    baseIRI: "",
    queryString: "",
    querySources: [],
    queryResult: null,
    resultSource: null,
    sourceType: null,
    mockFolder: 'https://md.bu/mockfolder'
  }
  let object = new LdfTestCaseEvaluation(testCaseData, props);

  let fetcher: TpfMockFetcher = new TpfMockFetcher();

  describe('#parseMockedResponse', () => {

    it('should return a IMockedResponse', () => {
      nock('https://md.bu').get('/mockfolder/f24cc7f355c770c76d1bd6b39770f35a2ef48fbf.ttl')
        .reply(200,`# Query: null
# Hashed IRI: http://ex.org/
# Content-type: application/trig;charset=utf-8
@prefix void: <http://rdfs.org/ns/void#>.`);

      TpfMockFetcher.parseMockedResponse(requestedURI, object).then((value: IMockedResponse) => {
        expect(value.body).toEqual(`@prefix void: <http://rdfs.org/ns/void#>.`);
        expect(value.contentType).toEqual(`application/trig;charset=utf-8`);
        expect(value.iri).toEqual(`http://ex.org/`);
        expect(value.query).toEqual(`null`);
      });
    });

    it('should resolve', () => {
      nock('https://md.bu').get('/mockfolder/f24cc7f355c770c76d1bd6b39770f35a2ef48fbf.ttl')
        .reply(200,`# Query: null
# Hashed IRI: http://ex.org/
# Content-type: application/trig;charset=utf-8
@prefix void: <http://rdfs.org/ns/void#>.`);

      return expect(TpfMockFetcher.parseMockedResponse(requestedURI, object)).resolves.toBeTruthy();
    });

    it('should not resolve', () => {
      nock('https://md.bu').get('/mockfolder/f24cc7f355c770c76d1bd6b39770f35a2ef48fbf.ttl')
      .reply(200, null);

      return expect(TpfMockFetcher.parseMockedResponse(requestedURI, object)).rejects.toBeTruthy();
    });

  });

});