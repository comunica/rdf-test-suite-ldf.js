import { ILdfQueryEngine } from "../ILdfQueryEngine";
import { LdfTestCaseEvaluation } from "../LdfTestCaseEvaluationHandler";

/**
 * Interface for a LDF Query tester.
 */
export interface ILdfQueryTester {
  test(engine: ILdfQueryEngine, injectArguments: any, evaluation: LdfTestCaseEvaluation) : Promise <void>;
}