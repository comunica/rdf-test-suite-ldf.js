import { ITestCaseHandler, IQueryResult, TestCaseQueryEvaluationHandler, IFetchOptions, Util, IFetchResponse, ITestCaseData } from "rdf-test-suite";
import { Resource } from "rdf-object";
import { ILdfTestCase } from "./ILdfTestCase";
import { ILdfQueryEngine } from "./ILdfQueryEngine";
import { FileQueryTester } from "./testers/FileQueryTester";
import { TpfQueryTester } from "./testers/TpfQueryTester";
import { LdfUtil } from "../../LdfUtil";
// tslint:disable:no-var-requires
const stringifyStream = require('stream-to-string');
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
    // Check if Ldf source is stated
    if(!resource.property.sourceType){
      throw new Error(`Missing et:sourceType in ${resource}`);
    }
    // TODO: If sourceType is TPF: check if mockFolder is given!
    
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
        sourceType: resource.property.sourceType.value,
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
  // Necessary for testing different sourceTypes
  sourceType: string;
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

  constructor(testCaseData: ITestCaseData, props: ILdfTestaseEvaluationProps){
    Object.assign(this, testCaseData);
    Object.assign(this, props);
  }

  /* istanbul ignore next */
  public async test(engine: ILdfQueryEngine, injectArguments: any): Promise<void> {
    if(this.resultSource){
      // TODO: Fix a cleaner way for this case and removePrefix
      switch(LdfUtil.removePrefix(this.sourceType)) {
        case "File":
          return new FileQueryTester().test(engine, injectArguments, this);
        case "TPF":
          return new TpfQueryTester().test(engine, injectArguments, this);
        default:
          throw new Error(`The et:sourceType ${this.sourceType} is nog yet supported.`);
      }
    }
  }
}