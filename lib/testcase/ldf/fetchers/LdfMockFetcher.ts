import * as crypto from 'crypto';
import { ClientRequest, IncomingMessage } from "http";
import * as https from 'https';
import { LdfTestCaseEvaluation } from "../LdfTestCaseEvaluationHandler";
import { logger } from '../../../factory/Logger';

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
      const mockedUrl = this.getMockedFileURI(this.test.mockFolder, requestedURI);
      const req: ClientRequest = https.request(mockedUrl);
      req.on('response', (incoming: IncomingMessage) => {
        if (incoming.statusCode !== 200) {
          throw new Error(`Error while fetching ${mockedUrl} (${incoming.statusCode}): ${incoming.statusMessage}`);
        }
        incoming.setEncoding('utf8');
        incoming.on('data', (chunk: any) => {
          if (typeof chunk !== 'string') {
            throw new Error(`Content of request should be string: ${chunk}`);
          }
          body += chunk;
        });
        incoming.on('end', () => {
          // parse response and return
          try {
            const headerResponse: IHeaderResponse = this.pickHeaderLines(body);
            const headers: any = this.parseMockedFileHeaders(mockedUrl, headerResponse.header);
            const response: IMockedResponse = {
              body: headerResponse.body,
              contentType: headers['Content-type'],
              iri: headers['Hashed IRI'],
              query: headers.Query,
            };
            resolve(response);
          } catch (err) {
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
    if (mockFolderURI.endsWith('/')) {
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
    const parts: string[] = [];
    let part: string = '';
    for (const line of headers.split('\n')) {
      if (line.startsWith('#')) {
        if (part.length > 0) {
          parts.push(part);
        }
        part = '';
      }
      part += line;
    }
    parts.push(part);
    part = '';
    for (part of parts) {
      if (part.indexOf(':') < 0) {
        throw new Error(`Mocked testfile does not have valid header line: ${part} - ${uri}`);
      }
      part = part.substring(2); // Remove '# '
      const key = part.substring(0, part.indexOf(':')).trim(); // Parse key
      const value = part.substring(part.indexOf(':') + 1).trim(); // Parse value
      result[key] = value; // Put in dictionary
    }
    return result;
  }

  private pickHeaderLines(body: string): IHeaderResponse {
    const headerLines = [];
    let hashcount = 0;
    while (hashcount < 3) {
      const line = body.split('\n')[0];
      body = body.split('\n').splice(1).join('\n');
      if (line.startsWith('#')) {
        hashcount += 1;
      }
      headerLines.push(line);
    }
    return {
      body,
      header: headerLines.join('\n'),
    };
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

/**
 * Interface representing the header and the body of a mocked testfile;
 */
export interface IHeaderResponse {
  header: string;
  body: string;
}
