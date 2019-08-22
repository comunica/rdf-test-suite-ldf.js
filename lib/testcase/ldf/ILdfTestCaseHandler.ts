import { Resource } from "rdf-object";
import { ITestCase, ITestCaseData, IFetchOptions } from "rdf-test-suite";
import { LdfResponseMockerFactory } from "../../factory/LdfResponseMockerFactory";

/**
 * An ITestCaseHandler interprets a test case resource and constructs test cases.
 */
export interface ILdfTestCaseHandler<T extends ITestCase<any>> {
    resourceToLdfTestCase(resource: Resource, factory: LdfResponseMockerFactory, testCaseData: ITestCaseData, options?: IFetchOptions): Promise<T>;
}
