import { ILdfQueryTester } from "./ILdfQueryTester";
import { LdfTestCaseEvaluation } from "../LdfTestCaseEvaluationHandler";
import { ILdfQueryEngine } from "../ILdfQueryEngine";
import { IQueryResult } from "rdf-test-suite";

// TODO: Intercept and adapt all http responses


/**
 * Class for testing queries on TPF-sources.
 */
export class TpfQueryTester implements ILdfQueryTester {
  public async test(engine: ILdfQueryEngine, injectArguments: any, object: LdfTestCaseEvaluation) : Promise<void> {
    const result: IQueryResult = await engine.query(object.querySources, object.queryString, {});
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