import { ITestCaseHandler, IQueryResult, TestCaseQueryEvaluationHandler, IFetchOptions, Util, IFetchResponse, ITestCaseData } from "rdf-test-suite";
import { Resource } from "rdf-object";
import { ILdfTestCase } from "./ILdfTestCase";
import { ILdfQueryEngine } from "./ILdfQueryEngine";
import { LdfResponseMocker } from "./mock/LdfResponseMocker";
import * as stringifyStream from 'stream-to-string';
import * as cph from '@comunica/actor-http-proxy';
import * as fse from 'fs-extra';
import { IDataSource, ISource } from "./IDataSource";
import { LdfUtil } from "../../LdfUtil";
import { ILdfTestCaseHandler } from "./ILdfTestCaseHandler";
import { LdfResponseMockerFactory } from "../../factory/LdfResponseMockerFactory";
import { storeStream } from "rdf-store-stream";
const rdfParser = require('rdf-parse').default;
import * as C from '../../Colors';
import * as Path from 'path';
import { logger } from "../../factory/Logger";

/**
 * Test case handler for https://comunica.github.io/ontology-query-testing/ontology-query-testing.ttl#LdfQueryEvaluationTest.
 */
export class LdfTestCaseEvaluationHandler implements ILdfTestCaseHandler<LdfTestCaseEvaluation> {

  public async resourceToLdfTestCase(resource: Resource, factory: LdfResponseMockerFactory, testCaseData: ITestCaseData, options?: IFetchOptions): Promise<LdfTestCaseEvaluation> {
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
      },
      factory,
      options
    );
  }

}

export interface ILdfTestCaseEvaluationProps {
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

  private responseMocker: LdfResponseMocker;
  private readonly factory: LdfResponseMockerFactory;
  private readonly tmpFolder: string;
  private readonly options?: IFetchOptions;
  private createdFolder: boolean;

  constructor(testCaseData: ITestCaseData, props: ILdfTestCaseEvaluationProps, factory: LdfResponseMockerFactory, options?: IFetchOptions){
    Object.assign(this, testCaseData);
    Object.assign(this, props);
    this.factory = factory;
    this.tmpFolder = options && options.cachePath ? options.cachePath  : 'tmpfolder';
    this.options = options;
    this.createdFolder = false;
  }

  public async test(engine: ILdfQueryEngine, injectArguments: any): Promise<void> {
    return new Promise(async (resolve, reject) => {
      // Set up mock-server, load all resources
      this.responseMocker = await this.factory.getNewLdfResponseMocker();
      this.responseMocker.loadSources(this.dataSources);
      this.responseMocker.loadTest(this);

      await this.responseMocker.setUpServer();
      logger.info(C.inColor(`Run test: ${this.uri}`, C.GREEN));

      // Query and retrieve result
      this.mapSources(this.dataSources)
      .then(async (sources: ISource[]) => {
        const result: IQueryResult = await engine.query(this.queryString, { 
          sources,
          httpProxyHandler: new cph.ProxyHandlerStatic(this.responseMocker.proxyAddress),
        });
  
        // Tear down the mock-server for all sources
        await this.responseMocker.tearDownServer();
  
        if(this.createdFolder){
          fse.emptyDirSync(this.tmpFolder);
        }
  
        if (! await this.queryResult.equals(result)) {
          reject(new Error(`${C.inColor('Invalid query evaluation', C.RED)}
        
        ${C.inColor('Query:', C.YELLOW)} ${this.queryString}
        
        ${C.inColor('Data:', C.YELLOW)} ${JSON.stringify(this.dataSources) || 'none'}
        
        ${C.inColor('Result Source:', C.YELLOW)} ${this.resultSource.url}
        
        ${C.inColor('Expected:', C.YELLOW)} \n ${this.queryResult}
        
        ${C.inColor('Got:', C.YELLOW)} \n ${result.toString()}
        `));
        }
        resolve();
      })
      .catch(async (reason: string) => {
        await this.responseMocker.tearDownServer();
        reject(new Error(reason));
      });
    });
  }

  /**
   * Map the manifest-sourceTypes to the sourcetypes the engine uses (based on comunica-engines).
   * @param sources The sources from the manifest file
   */
  private mapSources(sources: IDataSource[]) : Promise<ISource[]> {
    return new Promise(async (resolve, reject) => {
      let rtrn: ISource[] = [];
      for(let source of sources){
        let is : ISource = source;
        switch(source.type.split('#')[1]){
          case 'TPF':
            is.type = '';
            break;
          case 'File':
            is.type = 'file';
            break;
          case 'SPARQL':
            is.type = 'sparql';
            break;
          case 'HDT':
            fse.ensureDirSync(this.tmpFolder);
            
            let hdtFile: string = await LdfUtil.fetchFile(this.tmpFolder, source);

            if(! this.options || ! this.options.cachePath) this.createdFolder = true;

            is.type = 'hdtFile';
            is.value = Path.join(process.cwd(), this.tmpFolder, hdtFile);
            break;
          case 'RDFJS':
            fse.ensureDirSync(this.tmpFolder);

            let rdfjsFile: string = await LdfUtil.fetchFile(this.tmpFolder, source);
            let stream : NodeJS.ReadableStream = fse.createReadStream(Path.join(process.cwd(), this.tmpFolder, rdfjsFile));        
            const quadStream = rdfParser.parse(stream, { contentType: 'text/turtle' });
            
            if(! this.options || ! this.options.cachePath) this.createdFolder = true;

            is.value = await storeStream(quadStream);
            is.type = 'rdfjsSource';
            break;
          default:
            reject(new Error(`The sourcetype: ${source.type} is not known.`));
        }
        rtrn.push(source);
      }
      resolve(rtrn);
    });
  }

}