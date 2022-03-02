import {DataFactory} from "rdf-data-factory";
import {ContextParser} from "jsonld-context-parser";
import {Resource} from "rdf-object";
import {IQueryResult, QueryResultQuads, TestCaseQueryEvaluationHandler, Util} from "rdf-test-suite";
import {LdfResponseMockerFactory} from "../../../../lib/factory/LdfResponseMockerFactory";
import {ISource} from "../../../../lib/testcase/ldf/IDataSource";
import {ILdfQueryEngine} from "../../../../lib/testcase/ldf/ILdfQueryEngine";
import {
  LdfTestCaseEvaluation,
  LdfTestCaseEvaluationHandler,
} from "../../../../lib/testcase/ldf/LdfTestCaseEvaluationHandler";
import {LdfResponseMocker} from "../../../../lib/testcase/ldf/mock/LdfResponseMocker";
const quad = require('rdf-quad');
const streamifyString = require('streamify-string');

const DF = new DataFactory();

// Mock fetch
(<any> global).fetch = (url: string) => {
  let body;
  let headers = new Headers({ a: 'b' });
  switch (url) {
  case 'ACTION.ok':
    body = streamifyString(`OK`);
    break;
  case 'RESULT.ttl':
    body = streamifyString(`@prefix : <http://ex.org#> . :s1 :o1 "t1", "t2".`);
    headers = new Headers({ 'Content-Type': 'text/turtle' });
    break;
  default:
    return Promise.reject(new Error('Fetch error'));
  }
  return Promise.resolve(new Response(body, <any> { headers, status: 200, url }));
};

const factory: LdfResponseMockerFactory = new LdfResponseMockerFactory(<any> { startPort: 7001 });

describe('LdfResponseMocker', () => {

  const handler = new LdfTestCaseEvaluationHandler();
  const engine: ILdfQueryEngine = {
    queryLdf: (sources: ISource[], proxyUrl: string, queryString: string, options: {[key: string]: any}) =>
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
  let pDataSources: any;
  let pSource: any;
  let pMockFolder: any;

  beforeEach((done) => {
    // tslint:disable:max-line-length
    new ContextParser().parse(require('../../../../lib/context-manifest.json'))
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

  describe('#setUpServer', () => {

    it('should set up a reachable and working server', async () => {
      const mocker: LdfResponseMocker = await factory.getNewLdfResponseMocker();

      const resource = new Resource({ term: DF.namedNode('http://example.org/test'), context });
      const action = new Resource({ term: DF.namedNode('blabla'), context });
      action.addProperty(pQuery, new Resource({ term: DF.literal('ACTION.ok'), context }));
      action.addProperty(pMockFolder, new Resource({ term: DF.literal('examplefolder'), context }));

      const src1: Resource = new Resource({ term: DF.blankNode(), context });
      src1.addProperty(pSource, new Resource({ term: DF.literal('https://ex2.org'), context }));
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

      await mocker.setUpServer();
      mocker.loadTest(testCase);

      const result: IQueryResult = await engine.queryLdf(null, mocker.proxyAddress, null, {});

      mocker.tearDownServer();

      const queryResponse = await Util.fetchCached(resource.property.result.value);
      const queryResult = await TestCaseQueryEvaluationHandler.parseQueryResult(
        Util.identifyContentType('RESULT.ttl', queryResponse.headers),
        queryResponse.url, queryResponse.body);

      expect(mocker.proxyAddress).toEqual('http://127.0.0.1:7001/');
      expect(await queryResult.equals(result)).toBeTruthy();
    });

    it('should forward request over https', async () => {
      const mocker: LdfResponseMocker = await factory.getNewLdfResponseMocker();

      const resource = new Resource({ term: DF.namedNode('http://example.org/test'), context });
      const action = new Resource({ term: DF.namedNode('blabla'), context });
      action.addProperty(pQuery, new Resource({ term: DF.literal('ACTION.ok'), context }));
      action.addProperty(pMockFolder, new Resource({ term: DF.literal('examplefolder'), context }));

      const src1: Resource = new Resource({ term: DF.blankNode(), context });
      src1.addProperty(pSource, new Resource({ term: DF.literal('https://ex2.org'), context }));
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

      expect(mocker.isWhiteListed(undefined)).toBeFalsy();
      mocker.loadTest(testCase);
      mocker.loadSources(testCase.dataSources);

      expect(mocker.isWhiteListed('https://ex2.org')).toBeTruthy();
      expect(mocker.isWhiteListed('https://ex3.org')).toBeFalsy();

      mocker.tearDownServer();
      mocker.tearDownServer();
    });

    it('should use the default port', () => {
      const mock: LdfResponseMocker = new LdfResponseMocker({});
      expect(mock.proxyAddress).toEqual('http://127.0.0.1:3000/');
    });
  });

});
