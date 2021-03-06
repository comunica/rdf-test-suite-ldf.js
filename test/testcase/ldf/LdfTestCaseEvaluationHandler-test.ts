import {DataFactory} from "rdf-data-factory";
import "jest-rdf";
import {ContextParser} from "jsonld-context-parser";
import {Resource} from "rdf-object";
import {ITestCaseData, QueryResultQuads} from "rdf-test-suite";
import {LdfResponseMockerFactory} from "../../../lib/factory/LdfResponseMockerFactory";
import {ISource} from "../../../lib/testcase/ldf/IDataSource";
import {ILdfQueryEngine} from "../../../lib/testcase/ldf/ILdfQueryEngine";
import {
  ILdfTestCaseEvaluationProps,
  LdfTestCaseEvaluation,
  LdfTestCaseEvaluationHandler,
} from "../../../lib/testcase/ldf/LdfTestCaseEvaluationHandler";
const quad = require('rdf-quad');
const streamifyString = require('streamify-string');

const DF = new DataFactory();

// Mock fetch
(<any> global).fetch = (url: string) => {
  let body;
  let headers = new Headers({ a: 'b' });
  switch (url) {
  case 'ACTION.ok':
  case 'a.hdt':
    body = streamifyString(`OK`);
    break;
  case 'ACTION.invalid':
    body = streamifyString(`INVALID`);
    break;
  case 'RESULT.ttl':
    body = streamifyString(`@prefix : <http://ex.org#> . :s1 :o1 "t1", "t2".`);
    headers = new Headers({ 'Content-Type': 'text/turtle' });
    break;
  case 'RESULT_other.ttl':
    body = streamifyString(`@prefix : <http://ex.org#> . :s1 :o1 "t1".`);
    headers = new Headers({ 'Content-Type': 'text/turtle' });
    break;
  default:
    return Promise.reject(new Error('Fetch error'));
    break;
  }
  return Promise.resolve(new Response(body, <any> { headers, status: 200, url }));
};

// Urls representing the possible sourceTypes for a TestCaseLdfQueryEvaluationhandler
const tpfUrl: string = 'https://comunica.github.io/ontology-query-testing/ontology-query-testing.ttl#TPF';
const fileUrl: string = 'https://comunica.github.io/ontology-query-testing/ontology-query-testing.ttl#File';
const notSupported: string = 'https://comunica.github.io/ontology-query-testing/ontology-query-testing.ttl#NS';

const factory: LdfResponseMockerFactory = new LdfResponseMockerFactory(<any> { startPort: 6000 });

describe('TestCaseLdfQueryEvaluation', () => {

  const handler = new LdfTestCaseEvaluationHandler();

  let context: any;
  let pAction: any;
  let pQuery: any;
  let pResult: any;
  let pSourceType: any;
  let pTPF: any;
  let pDataSources: any;
  let pSource: any;
  let pMockFolder: any;

  beforeEach((done) => {
    // tslint:disable:max-line-length
    new ContextParser().parse(require('../../../lib/context-manifest.json'))
      .then((parsedContext) => {
        context = parsedContext;

        pAction = new Resource(
          { term: DF.namedNode('http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#action'), context });
        pQuery = new Resource(
          { term: DF.namedNode('http://www.w3.org/2001/sw/DataAccess/tests/test-query#query'), context });
        pResult = new Resource(
          { term: DF.namedNode('http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#result'), context });
        pSourceType = new Resource(
          { term: DF.namedNode('https://comunica.github.io/ontology-query-testing/ontology-query-testing.ttl#sourceType'), context });
        pTPF = new Resource(
          { term: DF.namedNode('https://comunica.github.io/ontology-query-testing/ontology-query-testing.ttl#TPF'), context });
        pDataSources = new Resource(
          { term: DF.namedNode('https://comunica.github.io/ontology-query-testing/ontology-query-testing.ttl#dataSources'), context });
        pSource = new Resource(
          { term: DF.namedNode('https://comunica.github.io/ontology-query-testing/ontology-query-testing.ttl#source'), context });
        pMockFolder =  new Resource(
          { term: DF.namedNode('https://comunica.github.io/ontology-query-testing/ontology-query-testing.ttl#mockFolder'), context });
        done();
      });
    // tslint:enable:max-line-length
  });

  describe('#resourceToTestCase', () => {
    it('should produce a TestCaseLdfQueryEvaluation', async () => {
      const resource = new Resource({ term: DF.namedNode('http://example.org/test'), context });
      const action = new Resource({ term: DF.namedNode('blabla'), context });
      action.addProperty(pQuery, new Resource({ term: DF.literal('ACTION.ok'), context }));
      action.addProperty(pMockFolder, new Resource({ term: DF.literal('examplefolder'), context }));

      const src1: Resource = new Resource({ term: DF.blankNode(), context });
      src1.addProperty(pSource, new Resource({ term: DF.literal('http://ex2.org'), context }));
      src1.addProperty(pSourceType, pTPF);
      const sources: Resource[] = [
        src1,
      ];
      const dataSources = new Resource({ term: DF.blankNode(), context });
      dataSources.list = sources;

      resource.addProperty(pAction, action);
      resource.addProperty(pResult, new Resource({ term: DF.literal('RESULT.ttl'), context }));
      resource.addProperty(pDataSources, dataSources);

      const testCase: LdfTestCaseEvaluation = await handler.resourceToLdfTestCase(resource, factory, <any> {});

      expect(testCase).toBeInstanceOf(LdfTestCaseEvaluation);
      expect(testCase.type).toEqual('ldf');
      expect(testCase.queryString).toEqual('OK');
      expect(testCase.queryResult.type).toEqual('quads');
      expect(testCase.dataSources).toEqual([{type: pTPF.value, value: 'http://ex2.org'}]);
      expect(testCase.queryResult.value).toBeRdfIsomorphic([
        quad('http://ex.org#s1', 'http://ex.org#o1', '"t1"'),
        quad('http://ex.org#s1', 'http://ex.org#o1', '"t2"'),
      ]);
      expect(testCase.mockFolder).toEqual('examplefolder');
    });

    it('should produce a TestCaseLdfQueryEvaluation with undefined mockFolder', async () => {
      const resource = new Resource({ term: DF.namedNode('http://example.org/test'), context });
      const action = new Resource({ term: DF.namedNode('blabla'), context });
      action.addProperty(pQuery, new Resource({ term: DF.literal('ACTION.ok'), context }));

      const src1: Resource = new Resource({ term: DF.blankNode(), context });
      src1.addProperty(pSource, new Resource({ term: DF.literal('http://ex2.org'), context }));
      src1.addProperty(pSourceType, pTPF);
      const sources: Resource[] = [
        src1,
      ];
      const dataSources = new Resource({ term: DF.blankNode(), context });
      dataSources.list = sources;

      resource.addProperty(pAction, action);
      resource.addProperty(pResult, new Resource({ term: DF.literal('RESULT.ttl'), context }));
      resource.addProperty(pDataSources, dataSources);

      const testCase: LdfTestCaseEvaluation = await handler.resourceToLdfTestCase(resource, factory, <any> {});

      expect(testCase).toBeInstanceOf(LdfTestCaseEvaluation);
      expect(testCase.type).toEqual('ldf');
      expect(testCase.queryString).toEqual('OK');
      expect(testCase.queryResult.type).toEqual('quads');
      expect(testCase.dataSources).toEqual([{type: pTPF.value, value: 'http://ex2.org'}]);
      expect(testCase.queryResult.value).toBeRdfIsomorphic([
        quad('http://ex.org#s1', 'http://ex.org#o1', '"t1"'),
        quad('http://ex.org#s1', 'http://ex.org#o1', '"t2"'),
      ]);
      expect(testCase.mockFolder).toEqual(undefined);
    });

    it('should error on a resource without action', () => {
      const resource = new Resource({ term: DF.namedNode('http://example.org/test'), context });

      return expect(handler.resourceToLdfTestCase(resource, factory, <any> {})).rejects.toBeTruthy();
    });

    it('should error on a resource without result', () => {
      const resource = new Resource({ term: DF.namedNode('http://example.org/test'), context });
      const action = new Resource({ term: DF.namedNode('blabla'), context });
      action.addProperty(pQuery, new Resource({ term: DF.literal('ACTION.ok'), context }));
      resource.addProperty(pAction, action);

      return expect(handler.resourceToLdfTestCase(resource, factory, <any> {})).rejects.toBeTruthy();
    });

    it('should error on a resource without query', () => {
      const resource = new Resource({ term: DF.namedNode('http://example.org/test'), context });
      const action = new Resource({ term: DF.namedNode('blabla'), context });
      resource.addProperty(pAction, action);
      resource.addProperty(pResult, new Resource({ term: DF.literal('RESULT.ttl'), context }));

      const src1: Resource = new Resource({ term: DF.blankNode(), context });
      src1.addProperty(pSource, new Resource({ term: DF.literal('http://ex2.org'), context }));
      src1.addProperty(pSourceType, pTPF);
      const sources: Resource[] = [
        src1,
      ];
      const dataSources = new Resource({ term: DF.blankNode(), context });
      dataSources.list = sources;

      resource.addProperty(pDataSources, dataSources);

      return expect(handler.resourceToLdfTestCase(resource, factory, <any> {})).rejects.toBeTruthy();
    });

    it('should error on an empty sources list', () => {
      const resource = new Resource({ term: DF.namedNode('http://example.org/test'), context });
      const action = new Resource({ term: DF.namedNode('blabla'), context });
      resource.addProperty(pAction, action);
      resource.addProperty(pResult, new Resource({ term: DF.literal('RESULT.ttl'), context }));

      const sources: Resource[] = [

      ];
      const dataSources = new Resource({ term: DF.blankNode(), context });
      dataSources.list = sources;

      resource.addProperty(pAction, action);
      resource.addProperty(pResult, new Resource({ term: DF.literal('RESULT.ttl'), context }));
      resource.addProperty(pDataSources, dataSources);

      return expect(handler.resourceToLdfTestCase(resource, factory, <any> {})).rejects.toBeTruthy();
    });

    it('should error when the result is unreadable', () => {
      const resource = new Resource({ term: DF.namedNode('http://example.org/test'), context });
      const action = new Resource({ term: DF.namedNode('blabla'), context });
      resource.addProperty(pAction, action);
      resource.addProperty(pResult, new Resource({ term: DF.literal('ACTION.invalid'), context }));

      const sources: Resource[] = [

      ];
      const dataSources = new Resource({ term: DF.blankNode(), context });
      dataSources.list = sources;

      resource.addProperty(pAction, action);
      resource.addProperty(pResult, new Resource({ term: DF.literal('RESULT.ttl'), context }));
      resource.addProperty(pDataSources, dataSources);

      return expect(handler.resourceToLdfTestCase(resource, factory, <any> {})).rejects.toBeTruthy();
    });

  });

});

describe('LdfTestCaseEvaluation', () => {

  const handler = new LdfTestCaseEvaluationHandler();
  const engine: ILdfQueryEngine = {
    queryLdf: (sources: ISource[], proxyUrl: string, queryString: string, options: {}) =>
      Promise.resolve(new QueryResultQuads([
        quad('http://ex.org#s1', 'http://ex.org#o1', '"t1"'),
        quad('http://ex.org#s1', 'http://ex.org#o1', '"t2"'),
      ])),
  };

  let context: any;
  let pAction: any;
  let pQuery: any;
  let pResult: any;
  let pSourceType: any;
  let pTPF: any;
  let pFile: any;
  let pHDT: any;
  let pRDFJS: any;
  let pUnknown: any;
  let pDataSources: any;
  let pSource: any;
  let pMockFolder: any;

  beforeEach((done) => {
    // tslint:disable:max-line-length
    new ContextParser().parse(require('../../../lib/context-manifest.json'))
      .then((parsedContext) => {
        context = parsedContext;

        pAction = new Resource(
          { term: DF.namedNode('http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#action'), context });
        pQuery = new Resource(
          { term: DF.namedNode('http://www.w3.org/2001/sw/DataAccess/tests/test-query#query'), context });
        pResult = new Resource(
          { term: DF.namedNode('http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#result'), context });
        pSourceType = new Resource(
          { term: DF.namedNode('https://comunica.github.io/ontology-query-testing/ontology-query-testing.ttl#sourceType'), context });
        pTPF = new Resource(
          { term: DF.namedNode('https://comunica.github.io/ontology-query-testing/ontology-query-testing.ttl#TPF'), context });
        pFile = new Resource(
          { term: DF.namedNode('https://comunica.github.io/ontology-query-testing/ontology-query-testing.ttl#File'), context });
        pHDT = new Resource(
          { term: DF.namedNode('https://comunica.github.io/ontology-query-testing/ontology-query-testing.ttl#HDT'), context });
        pRDFJS = new Resource(
          { term: DF.namedNode('https://comunica.github.io/ontology-query-testing/ontology-query-testing.ttl#RDFJS') });
        pUnknown = new Resource(
          { term: DF.namedNode('https://comunica.github.io/ontology-query-testing/ontology-query-testing.ttl#Unknown'), context });
        pDataSources = new Resource(
          { term: DF.namedNode('https://comunica.github.io/ontology-query-testing/ontology-query-testing.ttl#dataSources'), context });
        pSource = new Resource(
          { term: DF.namedNode('https://comunica.github.io/ontology-query-testing/ontology-query-testing.ttl#source'), context });
        pMockFolder =  new Resource(
          { term: DF.namedNode('https://comunica.github.io/ontology-query-testing/ontology-query-testing.ttl#mockFolder'), context });
        done();
      });
    // tslint:enable:max-line-length
  });

  describe('#constructor', () => {

    it('should create a LdfTestCaseEvaluation', () => {
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
        resultSource: {body: undefined, headers: undefined, url: undefined},
      };
      const testcase = new LdfTestCaseEvaluation(testCaseData, props, factory);
      expect(testcase).toBeInstanceOf(LdfTestCaseEvaluation);
      expect(testcase.dataSources).toEqual([]);
    });

    it('should reject when no resultSource is given', () => {
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
      };
      const testcase = new LdfTestCaseEvaluation(testCaseData, props, factory);
      expect(testcase.test(engine, {})).rejects.toBeTruthy();
    });

  });

  describe('TPF', () => {

    it('should produce TestCaseQueryEvaluation that tests true on equal results', async () => {
      const resource = new Resource({ term: DF.namedNode('http://example.org/test'), context });
      const action = new Resource({ term: DF.namedNode('blabla'), context });
      action.addProperty(pQuery, new Resource({ term: DF.literal('ACTION.ok'), context }));
      action.addProperty(pMockFolder, new Resource({ term: DF.literal('examplefolder'), context }));

      const src1: Resource = new Resource({ term: DF.blankNode(), context });
      src1.addProperty(pSource, new Resource({ term: DF.literal('http://ex2.org'), context }));
      src1.addProperty(pSourceType, pTPF);
      const sources: Resource[] = [
        src1,
      ];
      const dataSources = new Resource({ term: DF.blankNode(), context });
      dataSources.list = sources;

      resource.addProperty(pDataSources, dataSources);
      resource.addProperty(pAction, action);
      resource.addProperty(pResult, new Resource({ term: DF.literal('RESULT.ttl'), context }));

      const testCase: LdfTestCaseEvaluation = await handler.resourceToLdfTestCase(resource, factory, <any> {});

      return expect(testCase.test(engine, {})).resolves.toHaveProperty('duration');
    });

    it('should produce TestCaseQueryEvaluation that tests false on non-equal results', async () => {
      const resource = new Resource({ term: DF.namedNode('http://example.org/test'), context });
      const action = new Resource({ term: DF.namedNode('blabla'), context });
      action.addProperty(pQuery, new Resource({ term: DF.literal('ACTION.ok'), context }));
      action.addProperty(pMockFolder, new Resource({ term: DF.literal('examplefolder'), context }));

      const src1: Resource = new Resource({ term: DF.blankNode(), context });
      src1.addProperty(pSource, new Resource({ term: DF.literal('http://ex2.org'), context }));
      src1.addProperty(pSourceType, pTPF);
      const sources: Resource[] = [
        src1,
      ];
      const dataSources = new Resource({ term: DF.blankNode(), context });
      dataSources.list = sources;

      resource.addProperty(pAction, action);
      resource.addProperty(pResult, new Resource({ term: DF.literal('RESULT_other.ttl'), context }));
      resource.addProperty(pDataSources, dataSources);

      const testCase: LdfTestCaseEvaluation = await handler.resourceToLdfTestCase(resource, factory, <any> {});

      return expect(testCase.test(engine, {})).rejects.toBeTruthy();

    });

  });

  describe('FILE', () => {

    it('should produce TestCaseQueryEvaluation that tests true on equal results', async () => {
      const resource = new Resource({ term: DF.namedNode('http://example.org/test'), context });
      const action = new Resource({ term: DF.namedNode('blabla'), context });
      action.addProperty(pQuery, new Resource({ term: DF.literal('ACTION.ok'), context }));
      action.addProperty(pMockFolder, new Resource({ term: DF.literal('examplefolder'), context }));

      const src1: Resource = new Resource({ term: DF.blankNode(), context });
      src1.addProperty(pSource, new Resource({ term: DF.literal('http://ex2.org'), context }));
      src1.addProperty(pSourceType, pFile);
      const sources: Resource[] = [
        src1,
      ];
      const dataSources = new Resource({ term: DF.blankNode(), context });
      dataSources.list = sources;

      resource.addProperty(pAction, action);
      resource.addProperty(pResult, new Resource({ term: DF.literal('RESULT.ttl'), context }));
      resource.addProperty(pDataSources, dataSources);

      const testCase: LdfTestCaseEvaluation = await handler.resourceToLdfTestCase(resource, factory, <any> {});

      return expect(testCase.test(engine, {})).resolves.toHaveProperty('duration');
    });

    it('should produce TestCaseQueryEvaluation that tests false on non-equal results', async () => {
      const resource = new Resource({ term: DF.namedNode('http://example.org/test'), context });
      const action = new Resource({ term: DF.namedNode('blabla'), context });
      action.addProperty(pQuery, new Resource({ term: DF.literal('ACTION.ok'), context }));
      action.addProperty(pMockFolder, new Resource({ term: DF.literal('examplefolder'), context }));

      const src1: Resource = new Resource({ term: DF.blankNode(), context });
      src1.addProperty(pSource, new Resource({ term: DF.literal('http://ex2.org'), context }));
      src1.addProperty(pSourceType, pFile);
      const sources: Resource[] = [
        src1,
      ];
      const dataSources = new Resource({ term: DF.blankNode(), context });
      dataSources.list = sources;

      resource.addProperty(pAction, action);
      resource.addProperty(pResult, new Resource({ term: DF.literal('RESULT_other.ttl'), context }));
      resource.addProperty(pDataSources, dataSources);

      const testCase: LdfTestCaseEvaluation = await handler.resourceToLdfTestCase(resource, factory, <any> {});

      return expect(testCase.test(engine, {})).rejects.toBeTruthy();
    });

  });

  describe('UNKNOWN', () => {

    it('should throw an error', async () => {
      const resource = new Resource({ term: DF.namedNode('http://example.org/test'), context });
      const action = new Resource({ term: DF.namedNode('blabla'), context });
      action.addProperty(pQuery, new Resource({ term: DF.literal('ACTION.ok'), context }));
      action.addProperty(pMockFolder, new Resource({ term: DF.literal('examplefolder'), context }));

      const src1: Resource = new Resource({ term: DF.blankNode(), context });
      src1.addProperty(pSource, new Resource({ term: DF.literal('http://ex2.org'), context }));
      src1.addProperty(pSourceType, pUnknown);
      const sources: Resource[] = [
        src1,
      ];
      const dataSources = new Resource({ term: DF.blankNode(), context });
      dataSources.list = sources;

      resource.addProperty(pAction, action);
      resource.addProperty(pResult, new Resource({ term: DF.literal('RESULT_other.ttl'), context }));
      resource.addProperty(pDataSources, dataSources);

      const testCase: LdfTestCaseEvaluation = await handler.resourceToLdfTestCase(resource, factory, <any> {});

      expect(testCase.test(engine, {})).rejects.toBeTruthy();
    });

  });

});
