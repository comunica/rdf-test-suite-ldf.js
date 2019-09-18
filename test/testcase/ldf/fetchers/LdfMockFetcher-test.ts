import * as nock from 'nock';
import {ITestCaseData} from "rdf-test-suite";
import {LdfResponseMockerFactory} from "../../../../lib/factory/LdfResponseMockerFactory";
import {IMockedResponse, LdfMockFetcher} from "../../../../lib/testcase/ldf/fetchers/LdfMockFetcher";
import {
  ILdfTestCaseEvaluationProps,
  LdfTestCaseEvaluation,
} from "../../../../lib/testcase/ldf/LdfTestCaseEvaluationHandler";

describe('LdfMockFetcher', () => {

  const requestedURI: string = 'http://ex.org/';

  const testCaseData: ITestCaseData = {
    uri: "",
    types: ["", ""],
    name: "",
    comment: "",
    approval: "",
    approvedBy: "",
  };
  const props: ILdfTestCaseEvaluationProps = {
    baseIRI: "",
    queryString: "",
    dataSources: [],
    queryResult: null,
    resultSource: null,
    mockFolder: 'https://md.bu/mockfolder',
  };
  const object = new LdfTestCaseEvaluation(testCaseData, props, new LdfResponseMockerFactory(5000));
  const mockFetcher = new LdfMockFetcher(object);

  describe('#parseMockedResponse', () => {

    it('should return a IMockedResponse', () => {
      nock('https://md.bu').get('/mockfolder/f24cc7f355c770c76d1bd6b39770f35a2ef48fbf')
        .reply(200, `# Query: null
# Hashed IRI: http://ex.org/
# Content-type: application/trig;charset=utf-8
@prefix void: <http://rdfs.org/ns/void#>.`);

      mockFetcher.parseMockedResponse(requestedURI).then((value: IMockedResponse) => {
        expect(value.body).toEqual(`@prefix void: <http://rdfs.org/ns/void#>.`);
        expect(value.contentType).toEqual(`application/trig;charset=utf-8`);
        expect(value.iri).toEqual(`http://ex.org/`);
        expect(value.query).toEqual(`null`);
      });

    });

    it('should resolve with .trig', () => {
      nock('https://md.bu').get('/mockfolder/f24cc7f355c770c76d1bd6b39770f35a2ef48fbf')
        .reply(200, `# Query: null
# Hashed IRI: http://ex.org/
# Content-type: application/trig;charset=utf-8
@prefix void: <http://rdfs.org/ns/void#>.`);

      return expect(mockFetcher.parseMockedResponse(requestedURI)).resolves.toBeTruthy();
    });

    it('should resolve with .srj', () => {
      nock('https://md.bu').get('/mockfolder/f24cc7f355c770c76d1bd6b39770f35a2ef48fbf')
        .reply(200, `# Query: null
# Hashed IRI: http://ex.org/
# Content-type: application/sparql-results+json
@prefix void: <http://rdfs.org/ns/void#>.`);

      return expect(mockFetcher.parseMockedResponse(requestedURI)).resolves.toBeTruthy();
    });

    const props2: ILdfTestCaseEvaluationProps = {
      baseIRI: "",
      queryString: "",
      dataSources: [],
      queryResult: null,
      resultSource: null,
      mockFolder: 'https://md.bu/mockfolder/',
    };
    const object2 = new LdfTestCaseEvaluation(testCaseData, props2, new LdfResponseMockerFactory(5000));
    const mockFetcher2 = new LdfMockFetcher(object2);

    it('should remove trailing slash and try multiple accept', () => {
      nock('https://md.bu').get('/mockfolder/f24cc7f355c770c76d1bd6b39770f35a2ef48fbf')
        .reply(200, `# Query: null
# Hashed IRI: http://ex.org/
# Content-type: application/sparql-results+json
@prefix void: <http://rdfs.org/ns/void#>.`);

      return expect(mockFetcher2.parseMockedResponse(requestedURI)).resolves.toBeTruthy();
    });

  });

});
