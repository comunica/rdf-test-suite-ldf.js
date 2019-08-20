import { Server } from "http";
import { LdfTestCaseEvaluation } from "../LdfTestCaseEvaluationHandler";
import { IMockedResponse, LdfMockFetcher } from "../fetchers/LdfMockFetcher";

const http = require('http');


export class LdfResponseMocker {

  private dummyServer: Server;
  public readonly proxyAddress: string;

  constructor(port: number){
    // server will be initialized when testing
    this.dummyServer = undefined;
    this.proxyAddress = `http://127.0.0.1:${port}/` // default proxy address
  }

   /**
   * Temporarily set up a mocked server which will serve the mocked responses 
   * to the tested engine.
   * @param object The LdfTestCaseEvaluation we will be evaluating
   */
  public async setUpServer(object: LdfTestCaseEvaluation) : Promise<void> {
    return new Promise(async (resolve, reject) => {
      this.dummyServer = await http.createServer((request: any, response: any) => {
        let args = require('url').parse(request.url, true);
        let query = args.path.substring(1);
        let accept = request.headers.accept;
        LdfMockFetcher.parseMockedResponse(query, object, accept).then((mockedResponse: IMockedResponse) => {
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
  public tearDownServer() {
    if(this.dummyServer === undefined || ! this.dummyServer.listening ) return;
    this.dummyServer.close((err) => {
      if(err) throw err;
    });
  }

}