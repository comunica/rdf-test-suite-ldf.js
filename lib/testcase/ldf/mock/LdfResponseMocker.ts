import { Server } from "http";
import { LdfTestCaseEvaluation } from "../LdfTestCaseEvaluationHandler";
import { IMockedResponse, LdfMockFetcher } from "../fetchers/LdfMockFetcher";
import { IDataSource } from "../IDataSource";
import { ifStatement } from "@babel/types";
import { Util } from "rdf-test-suite";
import * as http from 'http';
import { LdfUtil } from "../../../LdfUtil";


export class LdfResponseMocker {

  private dummyServer: Server;
  private port: number;
  public readonly proxyAddress: string;
  private dataSources: IDataSource[];
  private whiteList: string[];


  constructor(port?: number){
    // server will be initialized later
    this.dummyServer = undefined;

    // datasources will be initialized when a test is loaded
    this.dataSources = undefined;

    this.port = port ? port : 3000; // Defaul port is 3000
    this.proxyAddress = `http://127.0.0.1:${this.port}/` // Proxy address 
  }

   /**
   * Temporarily set up a mocked server which will serve the mocked responses 
   * to the tested engine.
   * @param object The LdfTestCaseEvaluation we will be evaluating
   */
  /* istanbul ignore next */ // TODO: Have a look at a way to test this...
  public async setUpServer(object: LdfTestCaseEvaluation) : Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.dummyServer = await http.createServer().listen(this.port);
      this.dummyServer.on('request', async (request: any, response: any) => {
        let args : any = require('url').parse(request.url, true);
        let query : string = args.path.substring(1);
        let accept : string = request.headers.accept;
        if(this.isWhiteListed(query.split('/').slice(0, 3).join('/'))){
          // This response should not be mocked
          let options = {
            headers: args.headers
          }

          let client = LdfUtil.getHttpSClient(query.split('/')[0]);

          // Forward request and pipe to requesting instance
          let connector = client.request(query, options, (resp: any) => {
            resp.pipe(response);
          });
          request.pipe(connector);

        } else {
          // This response should be mocked
          LdfMockFetcher.parseMockedResponse(query, object, accept).then((mockedResponse: IMockedResponse) => {
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
  public tearDownServer() {
    if(this.dummyServer === undefined || ! this.dummyServer.listening ) return;
    this.dummyServer.close((err) => {
      if(err) throw err;
    });
  }

  /**
   * Set up the server for the upcoming test, this makes sure the LdfResponseMocker is re-usable
   */
  public loadTest(dataSources: IDataSource[]): void {
    this.dataSources = dataSources;
    this.fillWhiteList();
  }

  /**
   * Fill the whitelist with sources which are allowed to pass through the proxy and shouldn't be mocked.
   */
  public fillWhiteList() : void {
    this.whiteList = [];
    for(let source of this.dataSources){
      if(source.type != 'https://manudebuck.github.io/query-testing-ontology/query-testing-ontology.ttl#TPF'
      && source.type != 'https://manudebuck.github.io/query-testing-ontology/query-testing-ontology.ttl#SPARQL'){
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