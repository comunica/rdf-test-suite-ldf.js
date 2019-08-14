import { ILdfQueryTester } from "./ILdfQueryTester";
import { LdfTestCaseEvaluation } from "../LdfTestCaseEvaluationHandler";
import { ILdfQueryEngine } from "../ILdfQueryEngine";
import { IQueryResult } from "rdf-test-suite";
import { Server, ClientRequest, IncomingMessage,} from "http";
import { IMockedResponse, TpfMockFetcher } from "./fetchers/TpfMockFetcher";

const http = require('http');
const https = require('https');
const ProxyHandlerStatic = require("@comunica/actor-http-proxy").ProxyHandlerStatic;
const crypto = require('crypto');

/**
 * Class for testing queries on TPF-sources.
 */
export class TpfQueryTester implements ILdfQueryTester {

  private dummyServer: Server;
  private readonly proxyAddress: string;

  constructor(){
    // undefined before the tests
    this.dummyServer = undefined;
    this.proxyAddress = `http://127.0.0.1:3000/`;
  }

  /**
   * This test makes use of a local hosted dummy-proxy server which alters
   * the responses to make sure tests are valid over time.
   * @param engine The engine we are testing
   * @param injectArguments 
   * @param object The LdfTestCaseEvaluation which we are evaluating
   */
  public async test(engine: ILdfQueryEngine, injectArguments: any, object: LdfTestCaseEvaluation) : Promise<void> {
    await this.setUpServer(object);
    const result: IQueryResult = await engine.query(object.queryString, { 
      sources: object.querySources,
      httpProxyHandler: new ProxyHandlerStatic(this.proxyAddress),
    });
    this.tearDownServer();
    
    if (! await object.queryResult.equals(result)) {
      throw new Error(`Invalid query evaluation
  
  Query: ${object.queryString}

  Data: ${object.querySources || 'none'}
  
  Result Source: ${object.resultSource.url}
  
  Expected: ${object.queryResult.toString()}
  
  Got: \n ${result.toString()}
  `);
    }
  }

  /**
   * Temporarily set up a mocked server which will serve the mocked responses 
   * to the tested engine.
   * @param object The LdfTestCaseEvaluation we will be evaluating
   */
  private async setUpServer(object: LdfTestCaseEvaluation) : Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.dummyServer = await http.createServer((request: any, response: any) => {
        let args = require('url').parse(request.url, true);
        let query = args.path.substring(1);
        TpfMockFetcher.parseMockedResponse(query, object).then((mockedResponse: IMockedResponse) => {
          response.writeHead(200, {'Content-Type': mockedResponse.contentType });
          response.end(mockedResponse.body);
        });
      }).listen(3000);
      resolve();
    });
  }

  /**
   * Tear the server down after quering, avoid spilling resources and leaving ports blocked.
   */
  private tearDownServer() {
    if(this.dummyServer === undefined || ! this.dummyServer.listening ) return;
    this.dummyServer.close((err) => {
      if(err) throw err;
    });
  }

}

