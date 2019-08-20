import { Resource } from "rdf-object";
import { namedNode, literal, blankNode } from "@rdfjs/data-model";
import { ContextParser } from "jsonld-context-parser";
import { QueryResultQuads, IQueryResult, TestCaseQueryEvaluationHandler, Util } from "rdf-test-suite";
import { LdfTestCaseEvaluationHandler, LdfTestCaseEvaluation } from "../../../../lib/testcase/ldf/LdfTestCaseEvaluationHandler";
import { LdfResponseMocker } from "../../../../lib/testcase/ldf/mock/LdfResponseMocker";
import * as quad from 'rdf-quad';
import *  as streamifyString from 'streamify-string';
import * as phs from '@comunica/actor-http-proxy';

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
    break;
  }
  return Promise.resolve(new Response(body, <any> { headers, status: 200, url }));
};

describe('LdfResponseMocker', () => {

  const handler = new LdfTestCaseEvaluationHandler();
  const engine = {
    parse: (queryString: string) => queryString === 'OK'
      ? Promise.resolve(null) : Promise.reject(new Error('Invalid data ' + queryString)),
    query: (queryString: string, options: {[key: string]: any}) => Promise.resolve(new QueryResultQuads([
      quad('http://ex.org#s1', 'http://ex.org#o1', '"t1"'),
      quad('http://ex.org#s1', 'http://ex.org#o1', '"t2"'),
    ])),
  };

  let context;
  let pAction;
  let pQuery;
  let pResult;
  let pSourceType;
  let pTPF;
  let pSources;
  let pMockFolder;

  beforeEach((done) => {
    new ContextParser().parse(require('../../../../lib/context-manifest.json'))
      .then((parsedContext) => {
        context = parsedContext;

        pAction = new Resource(
          { term: namedNode('http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#action'), context });
        pQuery = new Resource(
          { term: namedNode('http://www.w3.org/2001/sw/DataAccess/tests/test-query#query'), context });
        pResult = new Resource(
          { term: namedNode('http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#result'), context });
        pSourceType = new Resource(
          { term: namedNode('https://manudebuck.github.io/engine-ontology/engine-ontology.ttl#sourceType'), context });
        pTPF = new Resource(
          { term: namedNode('https://manudebuck.github.io/engine-ontology/engine-ontology.ttl#TPF'), context });
        pSources = new Resource(
          { term: namedNode('https://manudebuck.github.io/engine-ontology/engine-ontology.ttl#sources'), context });
        pMockFolder =  new Resource(
          { term: namedNode('https://manudebuck.github.io/engine-ontology/engine-ontology.ttl#mockFolder'), context });
        done();
      });
  });

  let mocker: LdfResponseMocker = new LdfResponseMocker(4444);

  describe('#setUpServer', () => {

    it('sould set up a reachable and working server', async () => {
      const resource = new Resource({ term: namedNode('http://example.org/test'), context });
      const action = new Resource({ term: namedNode('blabla'), context });
      action.addProperty(pQuery, new Resource({ term: literal('ACTION.ok'), context }));
      action.addProperty(pMockFolder, new Resource({ term: literal('examplefolder'), context }));
      const sources : Resource[] = [
        new Resource({ term: namedNode('http://ex2.org'), context })
      ];
      const srcs = new Resource({ term: blankNode(), context });
      srcs.list = sources;
      action.addProperty(pSources, srcs);
      resource.addProperty(pAction, action);
      resource.addProperty(pResult, new Resource({ term: literal('RESULT.ttl'), context }));
      resource.addProperty(pSourceType, pTPF);

      const testCase: LdfTestCaseEvaluation = await handler.resourceToTestCase(resource, <any> {});

      await mocker.setUpServer(testCase);

      const result: IQueryResult = await engine.query(this.queryString, { 
        sources: this.querySources,
        httpProxyHandler: new phs.ProxyHandlerStatic(mocker.proxyAddress),
      });
  
      mocker.tearDownServer();

      const queryResponse = await Util.fetchCached(resource.property.result.value);
      let queryResult = await TestCaseQueryEvaluationHandler.parseQueryResult(
        Util.identifyContentType('RESULT.ttl', queryResponse.headers),
        queryResponse.url, queryResponse.body);
        
      expect(mocker.proxyAddress).toEqual('http://127.0.0.1:4444/');
      expect(await queryResult.equals(result)).toBeTruthy();
    });

  });

});