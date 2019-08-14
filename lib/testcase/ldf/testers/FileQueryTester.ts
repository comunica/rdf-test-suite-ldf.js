import { ILdfQueryTester } from "./ILdfQueryTester";
import { ILdfQueryEngine } from "../ILdfQueryEngine";
import { LdfTestCaseEvaluation } from "../LdfTestCaseEvaluationHandler";
import { IQueryResult } from "rdf-test-suite";

/**
 * Class for testing queries on file-sources.
 */
export class FileQueryTester implements ILdfQueryTester {
  public async test(engine: ILdfQueryEngine, injectArguments: any, object: LdfTestCaseEvaluation) : Promise<void> {
    const result : IQueryResult = await engine.query(object.querySources, object.queryString, {});
    if (! await object.queryResult.equals(result)) {
      throw new Error(`Invalid query evaluation
  
  Query: ${object.queryString}

  Data: ${object.querySources || 'none'}
  
  Result Source: ${object.resultSource.url}
  
  Expected: ${object.queryResult.toString()}
  
  Got: \n ${result.toString()}
  `);
    }
  }
}