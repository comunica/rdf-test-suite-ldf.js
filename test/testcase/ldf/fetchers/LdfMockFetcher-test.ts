import { LdfTestCaseEvaluation, ILdfTestCaseEvaluationProps } from "../../../../lib/testcase/ldf/LdfTestCaseEvaluationHandler";
import { ITestCaseData } from "rdf-test-suite";
import { LdfMockFetcher, IMockedResponse } from "../../../../lib/testcase/ldf/fetchers/LdfMockFetcher";
import * as nock from 'nock';
import { LdfResponseMockerFactory } from "../../../../lib/factory/LdfResponseMockerFactory";

describe('LdfMockFetcher', () => {

  let requestedURI: string = 'http://ex.org/';

  let testCaseData: ITestCaseData = {
    uri: "",
    types: ["", ""],
    name: "",
    comment: "",
    approval: "",
    approvedBy: "",
  };
  let props: ILdfTestCaseEvaluationProps = {
    baseIRI: "",
    queryString: "",
    dataSources: [],
    queryResult: null,
    resultSource: null,
    mockFolder: 'https://md.bu/mockfolder'
  }
  let object = new LdfTestCaseEvaluation(testCaseData, props, new LdfResponseMockerFactory(5000));
  let mockFetcher = new LdfMockFetcher(object);

  describe('#parseMockedResponse', () => {

    it('should return a IMockedResponse', () => {
      nock('https://md.bu').get('/mockfolder/f24cc7f355c770c76d1bd6b39770f35a2ef48fbf')
        .reply(200,`# Query: null
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
        .reply(200,`# Query: null
# Hashed IRI: http://ex.org/
# Content-type: application/trig;charset=utf-8
@prefix void: <http://rdfs.org/ns/void#>.`);

      return expect(mockFetcher.parseMockedResponse(requestedURI)).resolves.toBeTruthy();
    });

    it('should resolve with .srj', () => {
      nock('https://md.bu').get('/mockfolder/f24cc7f355c770c76d1bd6b39770f35a2ef48fbf')
        .reply(200,`# Query: null
# Hashed IRI: http://ex.org/
# Content-type: application/sparql-results+json
@prefix void: <http://rdfs.org/ns/void#>.`);

      return expect(mockFetcher.parseMockedResponse(requestedURI)).resolves.toBeTruthy();
    });

    it('should not resolve', () => {
      nock('https://md.bu').get('/mockfolder/f24cc7f355c770c76d1bd6b39770f35a2ef48fbf')
      .reply(200, null);

      return expect(mockFetcher.parseMockedResponse(requestedURI)).rejects.toBeTruthy();
    });

    let props2: ILdfTestCaseEvaluationProps = {
      baseIRI: "",
      queryString: "",
      dataSources: [],
      queryResult: null,
      resultSource: null,
      mockFolder: 'https://md.bu/mockfolder/'
    }
    let object2 = new LdfTestCaseEvaluation(testCaseData, props2, new LdfResponseMockerFactory(5000));
    let mockFetcher2 = new LdfMockFetcher(object2);

    it('should remove trailing slash and try multiple accept', () => {
      nock('https://md.bu').get('/mockfolder/f24cc7f355c770c76d1bd6b39770f35a2ef48fbf')
        .reply(200,`# Query: null
# Hashed IRI: http://ex.org/
# Content-type: application/sparql-results+json
@prefix void: <http://rdfs.org/ns/void#>.`);

      return expect(mockFetcher2.parseMockedResponse(requestedURI)).resolves.toBeTruthy();
    });

  });

});