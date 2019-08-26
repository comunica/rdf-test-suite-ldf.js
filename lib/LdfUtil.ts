import * as fs from 'fs';
import { IDataSource } from './testcase/ldf/IDataSource';
import * as Path from "path";
const fetch = require('node-fetch');

/**
 * A class with utility functions.
 */
export class LdfUtil {
  
  /**
   * Removes the prefix of a resource. Presuming the prefix ends wih '#'
   * @param resourceIRI A string representing the IRI of the resource
   */
  public static removePrefix(resourceIRI: string) : string {
    if(resourceIRI.indexOf('#') > 0){
      return resourceIRI.substring(resourceIRI.indexOf('#') + 1,resourceIRI.length);
    }
    // else: not implemented.
    return resourceIRI;
  }

  /**
   * Get a http(s)-client for requesting depending on the used protocol
   * @param protocol The protocol based for whom we want a http(s)client 
   */
  public static getHttpSClient(protocol: string) : any {
    switch(protocol){
      case "http:":
        return require('http');
      case "https:":
        return require('https');
    }
  }

  /**
   * Temporarily fetch a file for the query engine
   * @param folder: The folder where the temporary file should be saved
   * @param source: The IDataSource representing the source that should be fetched
   */
  public static async fetchFile(folder: string, source: IDataSource): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let iri: string = source.value;
      // we want to re-use the current filename for the temp file
      let filename: string = iri.split('/').slice(-1)[0];
      const file = fs.createWriteStream(Path.join(process.cwd(), folder, filename));
      
      this.getHttpSClient(iri.split('/')[0]).get(iri, (response: any) => {
        response.on('data', (data: any) => {
          file.write(data);
        });
        response.on('end', () => {
          file.end();
          resolve(filename);
        });

      });
      
    });
  }

}