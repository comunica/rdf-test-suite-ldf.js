import { IManifest, ITestResult, TestSuiteRunner } from "rdf-test-suite";
import { logger } from "./factory/Logger";
import { LdfManifestLoader } from "./LdfManifestLoader";

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
    config.urlToFileMapping = <any> this.fromUrlToMappingString(config.urlToFileMapping);
    const manifest: IManifest = await new LdfManifestLoader()
      .from(manifestUrl, config);
    const results: ITestResult[] = [];

    // Only run the tests for the given specification if one was defined.
    if (config.specification) {
      if (!manifest.specifications || !manifest.specifications[config.specification]) {
        return [];
      }
      await this.runManifestConcrete(manifest.specifications[config.specification], handler, config, results);
      return results;
    }

    logger.info('Running manifest');
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
  serverTerminationDelay?: number;
}
