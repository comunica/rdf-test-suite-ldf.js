import { ITestCase } from "rdf-test-suite";
import { ILdfQueryEngine } from "./ILdfQueryEngine";

/**
 * A Linked Data Fragments test case data holder.
 */
export interface ILdfTestCase extends ITestCase<ILdfQueryEngine> {
  type: 'ldf';
}