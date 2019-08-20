import { ITestCaseHandler, IQueryResult, TestCaseQueryEvaluationHandler, IFetchOptions, Util, IFetchResponse, ITestCaseData } from "rdf-test-suite";
import { Resource } from "rdf-object";
import { ILdfTestCase } from "./ILdfTestCase";
import { ILdfQueryEngine } from "./ILdfQueryEngine";
import { LdfResponseMocker } from "./mock/LdfResponseMocker";
// tslint:disable:no-var-requires
const stringifyStream = require('stream-to-string');
const ProxyHandlerStatic = require("@comunica/actor-http-proxy").ProxyHandlerStatic;
// tslint:enable:no-var-requires


/**
 * Test case handler for https://manudebuck.github.io/engine-ontology/engine-ontology.ttl#LdfQueryEvaluationTest.
 */
export class LdfTestCaseEvaluationHandler implements ITestCaseHandler<LdfTestCaseEvaluation> {

  constructor(){

  }

  public async resourceToTestCase(resource: Resource, testCaseData: ITestCaseData, options?: IFetchOptions): Promise<LdfTestCaseEvaluation> {
    if(!resource.property.action) {
      throw new Error(`Missing mf:action in ${resource}`);
    }
    if(!resource.property.result) {
      throw new Error(`Missing mf:result in ${resource}`);
    }
    const action = resource.property.action;
    if(!action.property.query){
      throw new Error(`Missing qt:query in mf:action of ${resource}`);
    }
    if(!action.property.sources){
      throw new Error(`Missing et:sources in mf:action of ${resource}`);
    }
    const queryResponse = await Util.fetchCached(resource.property.result.value, options);
    return new LdfTestCaseEvaluation(
      testCaseData,
      {
        baseIRI: Util.normalizeBaseUrl(action.property.query.value),
        queryString: await stringifyStream((await Util.fetchCached(action.property.query.value, options)).body),
        querySources: await Promise.all<string>([].concat.apply([],
          action.properties.sources.map((entrySources: Resource) => entrySources.list.map(
          (entry: Resource) => entry.term.value)))),
        queryResult: await TestCaseQueryEvaluationHandler.parseQueryResult(
          Util.identifyContentType(queryResponse.url, queryResponse.headers),
          queryResponse.url, queryResponse.body),
        resultSource: queryResponse,
        sourceType: resource.property.sourceType ? resource.property.sourceType.value : undefined,
        mockFolder: action.property.mockFolder ? action.property.mockFolder.value : undefined
      }
    );
  }

}

export interface ILdfTestaseEvaluationProps {
  baseIRI: string;
  queryString: string;
  querySources: string[]; // urls to locations of data sources
  queryResult: IQueryResult;
  resultSource: IFetchResponse;
  sourceType?: string; // TODO: This is deprecated, will be removing soon
  mockFolder?: string;
}

export class LdfTestCaseEvaluation implements ILdfTestCase {
  public readonly type = "ldf";
  public readonly approval: string;
  public readonly approvedBy: string;
  public readonly comment: string;
  public readonly types: string[];
  public readonly name: string;
  public readonly uri: string;

  public readonly baseIRI: string;
  public readonly queryString: string;
  public readonly querySources: string[];
  public readonly queryResult: IQueryResult;
  public readonly resultSource: IFetchResponse;
  public readonly sourceType: string;
  public readonly mockFolder?: string;

  private readonly responseMocker: LdfResponseMocker;

  constructor(testCaseData: ITestCaseData, props: ILdfTestaseEvaluationProps){
    Object.assign(this, testCaseData);
    Object.assign(this, props);
    this.responseMocker = new LdfResponseMocker(3000);
  }

  public async test(engine: ILdfQueryEngine, injectArguments: any): Promise<void> {
    if(this.resultSource !== undefined){
      // Set up mock-server for all sources that need to be mocked
      await this.responseMocker.setUpServer(this);

      const result: IQueryResult = await engine.query(this.queryString, { 
        sources: this.querySources,
        httpProxyHandler: new ProxyHandlerStatic(this.responseMocker.proxyAddress),
      });

      // Tear down the mock-server for all sources
      this.responseMocker.tearDownServer();
      
      if (! await this.queryResult.equals(result)) {
        throw new Error(`Invalid query evaluation    
  
  Query: ${this.queryString}

  Data: ${this.querySources || 'none'}     
  
  Result Source: ${this.resultSource.url}    
  
  Expected: ${this.queryResult.toString()}     
  
  Got: \n ${result.toString()}
`);
      }
    } else {
      throw new Error(`There is no result source given: ${this.resultSource}`);
    }
  }
}