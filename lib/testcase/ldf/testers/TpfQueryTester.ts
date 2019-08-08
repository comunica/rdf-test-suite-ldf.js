/* istanbul ignore file */ 
import { ILdfQueryTester } from "./ILdfQueryTester";
import { LdfTestCaseEvaluation } from "../LdfTestCaseEvaluationHandler";
import { ILdfQueryEngine } from "../ILdfQueryEngine";

/**
 * Class for testing queries on TPF-sources.
 */
export class TpfQueryTester implements ILdfQueryTester {
  public async test(engine: ILdfQueryEngine, injectArguments: any, object: LdfTestCaseEvaluation) {
    // TODO: Implement this
  }
}