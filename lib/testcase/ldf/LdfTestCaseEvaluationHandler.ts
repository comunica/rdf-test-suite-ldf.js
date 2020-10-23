import * as fse from 'fs-extra';
import * as Path from 'path';
import {Resource} from "rdf-object";
import rdfParser from "rdf-parse";
import {storeStream} from "rdf-store-stream";
import {
  IFetchOptions,
  IFetchResponse,
  IQueryResult,
  ITestCaseData,
  ITestResultOverride,
  TestCaseQueryEvaluationHandler,
  Util,
} from "rdf-test-suite";
import * as stringifyStream from 'stream-to-string';
import {LdfResponseMockerFactory} from "../../factory/LdfResponseMockerFactory";
import {logger} from "../../factory/Logger";
import {LdfUtil} from "../../LdfUtil";
import {IDataSource, ISource} from "./IDataSource";
import {ILdfQueryEngine} from "./ILdfQueryEngine";
import {ILdfTestCase} from "./ILdfTestCase";
import {ILdfTestCaseHandler} from "./ILdfTestCaseHandler";
import {LdfResponseMocker} from "./mock/LdfResponseMocker";

/**
 * Test case handler for
 * https://comunica.github.io/ontology-query-testing/ontology-query-testing.ttl#LdfQueryEvaluationTest.
 */
export class LdfTestCaseEvaluationHandler implements ILdfTestCaseHandler<LdfTestCaseEvaluation> {

  public async resourceToLdfTestCase(resource: Resource, factory: LdfResponseMockerFactory,
                                     testCaseData: ITestCaseData, options?: IFetchOptions):
    Promise<LdfTestCaseEvaluation> {
    if (!resource.property.action) {
      throw new Error(`Missing mf:action in ${resource}`);
    }
    if (!resource.property.result) {
      throw new Error(`Missing mf:result in ${resource}`);
    }
    if (!resource.property.dataSources || resource.property.dataSources.list.length <= 0) {
      throw new Error(`Missing et:dataSources in ${resource}`);
    }
    const action = resource.property.action;
    if (!action.property.query) {
      throw new Error(`Missing qt:query in mf:action of ${resource}`);
    }

    const queryResponse = await Util.fetchCached(resource.property.result.value, options);
    return new LdfTestCaseEvaluation(
      testCaseData,
      {
        baseIRI: Util.normalizeBaseUrl(action.property.query.value),
        dataSources: await Promise.all<IDataSource>([].concat.apply([],
          resource.properties.dataSources.map((entrySources: Resource) => entrySources.list.map(
            (entry: Resource) => {
              return { value: entry.property.source.value, type: entry.property.sourceType.value };
            })))),
        mockFolder: action.property.mockFolder ? action.property.mockFolder.value : undefined,
        queryResult: await TestCaseQueryEvaluationHandler.parseQueryResult(
          Util.identifyContentType(queryResponse.url, queryResponse.headers),
          queryResponse.url, queryResponse.body),
        queryString: await stringifyStream((await Util.fetchCached(action.property.query.value, options)).body),
        resultSource: queryResponse,
      },
      factory,
      options,
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

  constructor(testCaseData: ITestCaseData, props: ILdfTestCaseEvaluationProps,
              factory: LdfResponseMockerFactory, options?: IFetchOptions) {
    Object.assign(this, testCaseData);
    Object.assign(this, props);
    this.factory = factory;
    this.tmpFolder = (options && options.cachePath) ? options.cachePath  : Path.join(process.cwd(), 'tmpfolder');
    this.options = options;
    this.createdFolder = false;
  }

  public async test(engine: ILdfQueryEngine, injectArguments: any): Promise<ITestResultOverride> {
    return new Promise(async (resolve, reject) => {
      // Set up mock-server, load all resources
      this.responseMocker = await this.factory.getNewLdfResponseMocker();
      this.responseMocker.loadSources(this.dataSources);
      this.responseMocker.loadTest(this);

      await this.responseMocker.setUpServer();
      logger.info(Util.withColor(`Run test: ${this.uri}`, Util.COLOR_GREEN));

      // Query and retrieve result
      this.mapSources(this.dataSources)
      .then(async (sources: ISource[]) => {
        const timeStart = process.hrtime();
        const result: IQueryResult = await engine.queryLdf(sources, this.responseMocker.proxyAddress, this.queryString,
          {
            baseIRI: this.baseIRI,
          });
        const timeEnd = process.hrtime(timeStart);
        const duration = (timeEnd[0] * 1000) + (timeEnd[1] / 1000000);

        // Wait a bit, as the engine may have background processes that will still need the server
        if (this.factory.options.serverTerminationDelay > 0) {
          await new Promise((subResolve) => setTimeout(subResolve, this.factory.options.serverTerminationDelay));
        }

        // Tear down the mock-server for all sources
        await this.responseMocker.tearDownServer();

        if (this.createdFolder) {
          fse.emptyDirSync(this.tmpFolder);
        }

        if (! await this.queryResult.equals(result)) {
          reject(new Error(`${Util.withColor('Invalid query evaluation', Util.COLOR_RED)}

        ${Util.withColor('Query:', Util.COLOR_YELLOW)} ${this.queryString}

        ${Util.withColor('Data:', Util.COLOR_YELLOW)} ${JSON.stringify(this.dataSources) || 'none'}

        ${Util.withColor('Result Source:', Util.COLOR_YELLOW)} ${this.resultSource.url}

        ${Util.withColor('Expected:', Util.COLOR_YELLOW)} \n ${this.queryResult}

        ${Util.withColor('Got:', Util.COLOR_YELLOW)} \n ${result.toString()}
        `));
        }
        resolve({ duration });
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
  private mapSources(sources: IDataSource[]): Promise<ISource[]> {
    return new Promise(async (resolve, reject) => {
      const rtrn: ISource[] = [];
      for (const source of sources) {
        const is: ISource = source;
        switch (source.type.split('#')[1]) {
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

          const hdtFile: string = source.value.split('/').slice(-1)[0];

          if (!fse.existsSync(hdtFile)) {
            await LdfUtil.fetchFile(this.tmpFolder, source, this.options);
          }
          if (! this.options || ! this.options.cachePath) {
            this.createdFolder = true;
          }

          is.type = 'hdtFile';
          is.value = Path.join(this.tmpFolder, hdtFile);
          break;
        case 'RDFJS':
          fse.ensureDirSync(this.tmpFolder);

          const rdfjsFile: string = source.value.split('/').slice(-1)[0];
          if (!fse.existsSync(rdfjsFile)) {
            await LdfUtil.fetchFile(this.tmpFolder, source, this.options);
          }
          const stream: NodeJS.ReadableStream = fse.createReadStream(Path.join(this.tmpFolder, rdfjsFile));
          const quadStream = rdfParser.parse(stream, { contentType: 'text/turtle' });

          if (!this.options || ! this.options.cachePath) {
            this.createdFolder = true;
          }

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
