import { Quad, Store } from "rdf-js";

/**
 * Interface representing one datasource of a test
 * (Store<Quad> is disabled here because a datasource value is always a literal)
 */
export interface IDataSource {
  value: string;
  type: string;
}

/**
 * Interface representing a source that can be given to a query-engine
 */
export interface ISource  {
  value: string | Store<Quad>;
  type: string;
}
