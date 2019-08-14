import { IQueryResult } from "rdf-test-suite";

/**
 * A query engine handler for Linked Data Fragments.
 */
export interface ILdfQueryEngine {
  parse(queryString: string, options: {[key: string]: any}) : Promise<void>;
  query(queryString: string, options: {[key: string]: any}): Promise<IQueryResult>;
}