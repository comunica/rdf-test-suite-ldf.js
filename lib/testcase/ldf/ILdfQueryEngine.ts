import { IQueryResult } from "rdf-test-suite";
import { ISource } from "./IDataSource";

/**
 * A query engine handler for Linked Data Fragments.
 */
export interface ILdfQueryEngine {
  /**
   * Execute the given query over the given sources.
   * @param {ISource[]} sources An array of sources.
   * @param {string} proxyUrl A proxy URL that should be prefixes to URL-based sources.
   * @param {string} queryString A query string.
   * @param {{[p: string]: any}} options Options that will be passed to the query engine.
   * @return {Promise<IQueryResult>} A promise resolving to a query result.
   */
  queryLdf(sources: ISource[], proxyUrl: string, queryString: string, options: {[key: string]: any}):
    Promise<IQueryResult>;
}
