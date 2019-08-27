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

  describe('#parseMockedResponse', () => {

    it('should return a IMockedResponse', () => {
      nock('https://md.bu').get('/mockfolder/f24cc7f355c770c76d1bd6b39770f35a2ef48fbf.trig')
        .reply(200,`# Query: null
# Hashed IRI: http://ex.org/
# Content-type: application/trig;charset=utf-8
@prefix void: <http://rdfs.org/ns/void#>.`);

    LdfMockFetcher.parseMockedResponse(requestedURI, object, "application/trig,application/ld+json").then((value: IMockedResponse) => {
        expect(value.body).toEqual(`@prefix void: <http://rdfs.org/ns/void#>.`);
        expect(value.contentType).toEqual(`application/trig;charset=utf-8`);
        expect(value.iri).toEqual(`http://ex.org/`);
        expect(value.query).toEqual(`null`);
      });
    });

    it('should resolve with .trig', () => {
      nock('https://md.bu').get('/mockfolder/f24cc7f355c770c76d1bd6b39770f35a2ef48fbf.trig')
        .reply(200,`# Query: null
# Hashed IRI: http://ex.org/
# Content-type: application/trig;charset=utf-8
@prefix void: <http://rdfs.org/ns/void#>.`);

      return expect(LdfMockFetcher.parseMockedResponse(requestedURI, object, "application/trig,application/ld+json")).resolves.toBeTruthy();
    });

    it('should resolve with .srj', () => {
      nock('https://md.bu').get('/mockfolder/f24cc7f355c770c76d1bd6b39770f35a2ef48fbf.srj')
        .reply(200,`# Query: null
# Hashed IRI: http://ex.org/
# Content-type: application/sparql-results+json
@prefix void: <http://rdfs.org/ns/void#>.`);

      return expect(LdfMockFetcher.parseMockedResponse(requestedURI, object, 'application/sparql-results+json')).resolves.toBeTruthy();
    });

    it('should error when the accept is unknown', () => {
      nock('https://md.bu').get('/mockfolder/f24cc7f355c770c76d1bd6b39770f35a2ef48fbf.srj')
        .reply(200,`# Query: null
# Hashed IRI: http://ex.org/
# Content-type: application/sparql-results+json
@prefix void: <http://rdfs.org/ns/void#>.`);

      return expect(LdfMockFetcher.parseMockedResponse(requestedURI, object, 'application/unknown')).rejects.toBeTruthy();
    });

    it('should not resolve', () => {
      nock('https://md.bu').get('/mockfolder/f24cc7f355c770c76d1bd6b39770f35a2ef48fbf.trig')
      .reply(200, null);

      return expect(LdfMockFetcher.parseMockedResponse(requestedURI, object, "application/trig,application/ld+json")).rejects.toBeTruthy();
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

    it('should remove trailing slash and try multiple accept', () => {
      nock('https://md.bu').get('/mockfolder/f24cc7f355c770c76d1bd6b39770f35a2ef48fbf.srj')
        .reply(200,`# Query: null
# Hashed IRI: http://ex.org/
# Content-type: application/sparql-results+json
@prefix void: <http://rdfs.org/ns/void#>.`);

      return expect(LdfMockFetcher.parseMockedResponse(requestedURI, object2, 'test1;q=0.75,application/sparql-results+json')).resolves.toBeTruthy();
    });

  });

});