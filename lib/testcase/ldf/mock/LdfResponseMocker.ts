import { Server } from "http";
import { LdfTestCaseEvaluation } from "../LdfTestCaseEvaluationHandler";
import { IMockedResponse, LdfMockFetcher } from "../fetchers/LdfMockFetcher";
import { IDataSource } from "../IDataSource";
import * as http from 'http';
import { LdfUtil } from "../../../LdfUtil";

export class LdfResponseMocker {

  private dummyServer: Server;
  private port: number;
  public readonly proxyAddress: string;
  private dataSources: IDataSource[];
  private whiteList: string[];
  private mockFetcher: LdfMockFetcher;

  constructor(port?: number){
    // server will be initialized later
    this.dummyServer = undefined;

    // datasources will be initialized when a test is loaded
    this.dataSources = undefined;

    this.port = port ? port : 3000; // Default port is 3000
    this.proxyAddress = `http://127.0.0.1:${this.port}/` // Proxy address of the proxy server
  }

   /**
   * Temporarily set up a mocked server which will serve the mocked responses 
   * to the tested engine.
   * @param object The LdfTestCaseEvaluation we will be evaluating
   */
  /* istanbul ignore next */
  public async setUpServer() : Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.dummyServer = await http.createServer().listen(this.port);
      this.dummyServer.on('request', async (request: any, response: any) => {
        let args : any = require('url').parse(request.url, true);
        let query : string = args.path.substring(1);
        // Whitelist: little hack, should be improved
        if(this.isWhiteListed(query.split('/').slice(0, 3).join('/'))){
          // This response should not be mocked
          let options = {
            headers: {
              accept: request.headers.accept
            }
          };

          let client = LdfUtil.getHttpSClient(query.split('/')[0]);

          // Forward request and pipe to requesting instance
          let connector = client.request(query, options, (resp: any) => {
            resp.pipe(response);
          });
          request.pipe(connector);
        } else {
          // This response should be mocked
          this.mockFetcher.parseMockedResponse(query).then((mockedResponse: IMockedResponse) => {
            response.writeHead(200, {'Content-Type': mockedResponse.contentType });
            response.end(mockedResponse.body);
          });
        }
      });
      resolve();
    });
  }

  /**
   * Tear the server down after quering, avoid spilling resources and leaving ports blocked.
   */
  public async tearDownServer() {
    return new Promise((resolve, reject) => {
      if(this.dummyServer === undefined || ! this.dummyServer.listening ) return;
      this.dummyServer.close((err) => {
        if(err) reject(err);
      });
      this.dummyServer.on('close', () => {
        resolve();
      });
    });
  }

  /**
   * Set up the server for the upcoming test datasources
   */
  public loadSources(dataSources: IDataSource[]): void {
    this.dataSources = dataSources;
    this.fillWhiteList();
  }

  /**
   * Load the test, create the mockfetcher based on this test
   * @param test The LdfTestCaseEvaluation the server will help to evaluate
   */
  public loadTest(test: LdfTestCaseEvaluation): void {
    this.mockFetcher = new LdfMockFetcher(test);
  }

  /**
   * Fill the whitelist with sources which are allowed to pass through the proxy and shouldn't be mocked.
   */
  public fillWhiteList() : void {
    this.whiteList = [];
    for(let source of this.dataSources){
      if(source.type != 'https://comunica.github.io/ontology-query-testing/ontology-query-testing.ttl#TPF'
      && source.type != 'https://comunica.github.io/ontology-query-testing/ontology-query-testing.ttl#SPARQL'){
      this.whiteList.push(source.value);
      }
    }
  }

  /**
   * Check if the dataSource is being whitelisted
   * @param dataSource The datasource 
   */
  public isWhiteListed(dataSource: string) : boolean {
    if(! this.whiteList) return false;
    for(let source of this.whiteList){
      if(source.startsWith(dataSource)) return true;
    }
    return false;
  }

}