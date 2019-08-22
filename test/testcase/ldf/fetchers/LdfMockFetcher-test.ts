import { LdfTestCaseEvaluation, ILdfTestaseEvaluationProps } from "../../../../lib/testcase/ldf/LdfTestCaseEvaluationHandler";
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
  let props: ILdfTestaseEvaluationProps = {
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
      nock('https://md.bu').get('/mockfolder/f24cc7f355c770c76d1bd6b39770f35a2ef48fbf.ttl')
        .reply(200,`# Query: null
# Hashed IRI: http://ex.org/
# Content-type: application/trig;charset=utf-8
@prefix void: <http://rdfs.org/ns/void#>.`);

    LdfMockFetcher.parseMockedResponse(requestedURI, object, "undefined").then((value: IMockedResponse) => {
        expect(value.body).toEqual(`@prefix void: <http://rdfs.org/ns/void#>.`);
        expect(value.contentType).toEqual(`application/trig;charset=utf-8`);
        expect(value.iri).toEqual(`http://ex.org/`);
        expect(value.query).toEqual(`null`);
      });
    });

    it('should resolve with .ttl', () => {
      nock('https://md.bu').get('/mockfolder/f24cc7f355c770c76d1bd6b39770f35a2ef48fbf.ttl')
        .reply(200,`# Query: null
# Hashed IRI: http://ex.org/
# Content-type: application/trig;charset=utf-8
@prefix void: <http://rdfs.org/ns/void#>.`);

      return expect(LdfMockFetcher.parseMockedResponse(requestedURI, object, "undefined")).resolves.toBeTruthy();
    });

    it('should resolve with .srj', () => {
      nock('https://md.bu').get('/mockfolder/f24cc7f355c770c76d1bd6b39770f35a2ef48fbf.srj')
        .reply(200,`# Query: null
# Hashed IRI: http://ex.org/
# Content-type: application/sparql-results+json
@prefix void: <http://rdfs.org/ns/void#>.`);

      return expect(LdfMockFetcher.parseMockedResponse(requestedURI, object, 'application/sparql-results+json')).resolves.toBeTruthy();
    });

    it('should not resolve', () => {
      nock('https://md.bu').get('/mockfolder/f24cc7f355c770c76d1bd6b39770f35a2ef48fbf.ttl')
      .reply(200, null);

      return expect(LdfMockFetcher.parseMockedResponse(requestedURI, object, "undefined")).rejects.toBeTruthy();
    });

  });

});