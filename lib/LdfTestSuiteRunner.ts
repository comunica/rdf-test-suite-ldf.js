import { TestSuiteRunner, IManifest, ITestResult, ITestSuiteConfig } from "rdf-test-suite";
import { LdfManifestLoader } from "./LdfManifestLoader";
import { WriteStream } from "fs";
import Timeout = NodeJS.Timeout;

/**
 * The LdfTestSuiteRunner runs ldf-query-engine test manifests.
 */
export class LdfTestSuiteRunner extends TestSuiteRunner {

  /**
   * Run the manifest with the given URL.
   * @param {string} manifestUrl The URL of a manifest.
   * @param handler The handler to run the tests with.
   * @param {string} cachePath The base directory to cache files in. If falsy, then no cache will be used.
   * @param {string} specification An optional specification to scope the manifest tests by.
   * @param {RegExp} testRegex An optional regex to filter test IRIs by.
   * @param {any} injectArguments An optional set of arguments to pass to the handler.
   * @return {Promise<ITestResult[]>} A promise resolving to an array of test results.
   */
  public async runManifest(manifestUrl: string, handler: any, config: ILdfTestSuiteConfig): Promise<ITestResult[]> {
    const { cachePath, specification, urlToFileMapping, startPort } = config;
    const urlToFileMappings = this.fromUrlToMappingString(urlToFileMapping);
    const manifest: IManifest = await new LdfManifestLoader().from(manifestUrl, { cachePath, urlToFileMappings }, startPort);
    const results: ITestResult[] = [];

    // Only run the tests for the given specification if one was defined.
    if (specification) {
      if (!manifest.specifications || !manifest.specifications[specification]) {
        return [];
      }
      await this.runManifestConcrete(manifest.specifications[specification], handler, config, results);
      return results;
    }

    await this.runManifestConcrete(manifest, handler, config, results);
    return results;
  }

}

export interface ILdfTestSuiteConfig {
  exitWithStatusCode0: boolean;
  outputFormat: string;
  timeOutDuration: number;
  customEngingeOptions: object;
  specification?: string;
  cachePath?: string;
  testRegex?: RegExp;
  urlToFileMapping?: string;
  startPort?: number;
}