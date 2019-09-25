import { Server } from "http";
import * as http from 'http';
import {Util} from "rdf-test-suite";
import {IFetchOptions} from "rdf-test-suite/lib/Util";
import { IMockedResponse, LdfMockFetcher } from "../fetchers/LdfMockFetcher";
import { IDataSource } from "../IDataSource";
import { LdfTestCaseEvaluation } from "../LdfTestCaseEvaluationHandler";

export class LdfResponseMocker {

  public readonly proxyAddress: string;

  private dummyServer: Server;
  private port: number;
  private dataSources: IDataSource[];
  private whiteList: string[];
  private mockFetcher: LdfMockFetcher;
  private options: IFetchOptions;

  constructor(options: IFetchOptions, port?: number) {
    // server will be initialized later
    this.dummyServer = undefined;

    // datasources will be initialized when a test is loaded
    this.dataSources = undefined;

    this.options = options;
    this.port = port ? port : 3000; // Default port is 3000
    this.proxyAddress = `http://127.0.0.1:${this.port}/`; // Proxy address of the proxy server
  }

  /**
   * Temporarily set up a mocked server which will serve the mocked responses
   * to the tested engine.
   */
  public async setUpServer(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.dummyServer = await http.createServer().listen(this.port);
      this.dummyServer.on('request', async (request: any, response: any) => {
        const args: any = require('url').parse(request.url, true);
        const query: string = args.path.substring(1);
        // Whitelist: little hack, should be improved
        if (this.isWhiteListed(query.split('/').slice(0, 3).join('/'))) {
          // This response should not be mocked

          // Forward request and pipe to requesting instance
          const fetched = await Util.fetchCached(request.url, this.options,
            { headers: { accept: request.headers.accept } });
          const headers: any = {};
          fetched.headers.forEach((v: string, k: string) => headers[k] = v);
          response.writeHead(200, headers);
          response.end(fetched.body);
        } else {
          // This response should be mocked
          this.mockFetcher.parseMockedResponse(query, this.options).then((mockedResponse: IMockedResponse) => {
            response.writeHead(200, {
              'Connection': 'Close', // Disable keep-alive headers to speedup closing of server
              'Content-Type': mockedResponse.contentType,
            });
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
      if (this.dummyServer === undefined || ! this.dummyServer.listening ) {
        resolve();
      }
      this.dummyServer.close((err) => {
        if (err) {
          reject(err);
        }
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
  public fillWhiteList(): void {
    this.whiteList = [];
    for (const source of this.dataSources) {
      if (source.type !== 'https://comunica.github.io/ontology-query-testing/ontology-query-testing.ttl#TPF'
        && source.type !== 'https://comunica.github.io/ontology-query-testing/ontology-query-testing.ttl#SPARQL') {
        this.whiteList.push(source.value);
      }
    }
  }

  /**
   * Check if the dataSource is being whitelisted
   * @param dataSource The datasource
   */
  public isWhiteListed(dataSource: string): boolean {
    if (!this.whiteList) {
      return false;
    }
    for (const source of this.whiteList) {
      if (source.startsWith(dataSource)) {
        return true;
      }
    }
    return false;
  }

}
