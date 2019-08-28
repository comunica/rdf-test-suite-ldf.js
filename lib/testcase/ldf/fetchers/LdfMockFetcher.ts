import { LdfTestCaseEvaluation } from "../LdfTestCaseEvaluationHandler";
import { ClientRequest, IncomingMessage } from "http";
import * as https from 'https';
import * as crypto from 'crypto';

/**
 * Class that fetches the mocked testfiles.
 */
export class LdfMockFetcher {

  private test: LdfTestCaseEvaluation;

  constructor(test: LdfTestCaseEvaluation) {
    this.test = test;
  }

  /**
   * Parse the mocked testfiles.
   * @param requestedURI The URI of the request the engine requests 
   * @param object The LdfTestCaseEvaluation we're testing 
   * @returns IMockedResponse representing the mocked testfiles
   */
  public parseMockedResponse(requestedURI: string): Promise<IMockedResponse> {
    return new Promise((resolve, reject) => {
      let body = '';
      const req: ClientRequest = https.request(this.getMockedFileURI(this.test.mockFolder, requestedURI));
      req.on('response', (incoming: IncomingMessage) => {
        incoming.setEncoding('utf8');
        incoming.on('data', (chunk: any) => {
          if(typeof chunk !== 'string')
            throw new Error(`Content of request should be string: ${chunk}`);
          body += chunk;
        });
        incoming.on('end', () => {
          // parse response and return 
          try {
            let headers: any = this.parseMockedFileHeaders(requestedURI, body.split('\n').splice(0,3).join('\n'));
            let response: IMockedResponse = {
              query: headers['Query'],
              iri: headers['Hashed IRI'],
              contentType: headers['Content-type'],
              body: body.split('\n').splice(3,).join('\n'),
            };
            resolve(response);
          } catch(err) {
            reject(err);
          }
        });
      });
      req.end();
    });
  }

  /**
   * Get the URI of the mocked testfile, by hashing the requestedURI and using the
   * URI of the folder containing the testfiles.
   * @param mockFolderURI The URI of the folder containing the mocked testfiles
   * @param requestedURI The URI of the request the engine requests
   */
  private getMockedFileURI(mockFolderURI: string, requestedURI: string): string {
    if(mockFolderURI.endsWith('/')){
      // test the mockfolderURI on trailing slashes
      mockFolderURI = mockFolderURI.slice(0, mockFolderURI.length - 1);
    }
    return mockFolderURI + '/' + crypto.createHash('sha1').update(decodeURIComponent(requestedURI)).digest('hex');
  }

  /**
   * Parse the headers of a mocked testfile (cfr. https://github.com/comunica/ontology-query-testing#README).
   * @param headers The header lines of the mocked testfile.
   * @returns a map with the header values.
   */
  private parseMockedFileHeaders(uri: string, headers: string): any {
    const result: any = {};
    for (let line of headers.split('\n')) {
      if (line.indexOf(':') < 0) {
        throw new Error(`Mocked testfile does not have valid header line: ${line} - ${uri}`);
      }
      line = line.substring(2); // Remove '# '
      const key = line.substring(0, line.indexOf(':')).trim(); // Parse key
      const value = line.substring(line.indexOf(':') + 1).trim(); // Parse value
      result[key] = value; // Put in dictionary
    }
    return result;
  }

}

/**
 * Interface representing a mocked testfile.
 */
export interface IMockedResponse {
  query: string;
  iri: string;
  contentType: string;
  body: string;
}