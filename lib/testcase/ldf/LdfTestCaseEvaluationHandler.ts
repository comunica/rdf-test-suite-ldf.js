import { ITestCaseHandler, IQueryResult, TestCaseQueryEvaluationHandler, IFetchOptions, Util, IFetchResponse, ITestCaseData } from "rdf-test-suite";
import { Resource } from "rdf-object";
import { ILdfTestCase } from "./ILdfTestCase";
import { ILdfQueryEngine } from "./ILdfQueryEngine";
import { LdfResponseMocker } from "./mock/LdfResponseMocker";
import * as stringifyStream from 'stream-to-string';
import * as cph from '@comunica/actor-http-proxy';
import { IDataSource } from "./IDataSource";


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
    if(!resource.property.dataSources || resource.property.dataSources.list.length <= 0){
      throw new Error(`Missing et:dataSources in ${resource}`);
    }
    const action = resource.property.action;
    if(!action.property.query){
      throw new Error(`Missing qt:query in mf:action of ${resource}`);
    }
    

    const queryResponse = await Util.fetchCached(resource.property.result.value, options);
    return new LdfTestCaseEvaluation(
      testCaseData,
      {
        baseIRI: Util.normalizeBaseUrl(action.property.query.value),
        queryString: await stringifyStream((await Util.fetchCached(action.property.query.value, options)).body),
        dataSources: await Promise.all<IDataSource>([].concat.apply([],
          resource.properties.dataSources.map((entrySources: Resource) => entrySources.list.map(
          (entry: Resource) => {
            return {'value': entry.property.source.value, 'type': entry.property.sourceType.value };
          })))),
        queryResult: await TestCaseQueryEvaluationHandler.parseQueryResult(
          Util.identifyContentType(queryResponse.url, queryResponse.headers),
          queryResponse.url, queryResponse.body),
        resultSource: queryResponse,
        mockFolder: action.property.mockFolder ? action.property.mockFolder.value : undefined
      }
    );
  }

}

export interface ILdfTestaseEvaluationProps {
  baseIRI: string;
  queryString: string;
  dataSources: IDataSource[]; // urls to locations of data sources
  queryResult: IQueryResult;
  resultSource: IFetchResponse;
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

  public readonly baseIRI: string; // IRI of query source
  public readonly queryString: string; 
  public readonly dataSources: IDataSource[];
  public readonly queryResult: IQueryResult;
  public readonly resultSource: IFetchResponse;
  public readonly mockFolder?: string;

  private readonly responseMocker: LdfResponseMocker;

  constructor(testCaseData: ITestCaseData, props: ILdfTestaseEvaluationProps){
    Object.assign(this, testCaseData);
    Object.assign(this, props);
    this.responseMocker = new LdfResponseMocker(this.dataSources);
  }

  public async test(engine: ILdfQueryEngine, injectArguments: any): Promise<void> {
    // Set up mock-server for all sources that need to be mocked
    await this.responseMocker.setUpServer(this);

    const result: IQueryResult = await engine.query(this.queryString, { 
      sources: this.dataSources.map((v: IDataSource) => { return v.value; }),
      httpProxyHandler: new cph.ProxyHandlerStatic(this.responseMocker.proxyAddress),
    });

    // Tear down the mock-server for all sources
    this.responseMocker.tearDownServer();
    
    if (! await this.queryResult.equals(result)) {
      throw new Error(`Invalid query evaluation    

  Query: ${this.queryString}

  Data: ${this.dataSources || 'none'}     
  
  Result Source: ${this.resultSource.url}    
  
  Expected: ${this.queryResult.toString()}     
  
  Got: \n ${result.toString()}
`);
    }
  }
}