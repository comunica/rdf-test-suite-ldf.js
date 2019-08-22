import * as fs from 'fs';

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
   * Temporarily fetch the hdt file for the query engine
   * @param hdtIRI The IRI of the .hdt-file that should be fetched
   */
  /* istanbul ignore next */
  public static fetchHdtFile(folder: string, hdtIRI: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      // we want to re-use the current filename for the temp file
      let filename: string = hdtIRI.split('/').slice(-1)[0];
      const file = fs.createWriteStream(folder +'/'+ filename);
      
      this.getHttpSClient(hdtIRI.split('/')[0]).get(hdtIRI, (response: any) => {
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