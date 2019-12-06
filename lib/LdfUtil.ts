import * as fs from 'fs';
import * as Path from "path";
import {Util} from "rdf-test-suite";
import {IFetchOptions} from "rdf-test-suite/lib/Util";
import { IDataSource } from './testcase/ldf/IDataSource';

/**
 * A class with utility functions.
 */
export class LdfUtil {

  /**
   * Removes the prefix of a resource. Presuming the prefix ends wih '#'
   * @param resourceIRI A string representing the IRI of the resource
   */
  public static removePrefix(resourceIRI: string): string {
    if (resourceIRI.indexOf('#') > 0) {
      return resourceIRI.substring(resourceIRI.indexOf('#') + 1, resourceIRI.length);
    }
    // else: not implemented.
    return resourceIRI;
  }

  /**
   * Temporarily fetch a file for the query engine
   * @param folder: The folder where the temporary file should be saved
   * @param source: The IDataSource representing the source that should be fetched
   * @param {IFetchOptions} options Options for fetching.
   */
  public static async fetchFile(folder: string, source: IDataSource, options?: IFetchOptions): Promise<string> {
    return new Promise(async (resolve) => {
      const iri: string = source.value;
      // we want to re-use the current filename for the temp file
      const filename: string = iri.split('/').slice(-1)[0];
      const file = fs.createWriteStream(Path.join(folder, filename));
      const { body } = await Util.fetchCached(iri, options);
      body.pipe(file).on('finish', () => resolve(filename));
    });
  }

}
