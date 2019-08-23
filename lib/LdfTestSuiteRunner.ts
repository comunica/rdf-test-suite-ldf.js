import { TestSuiteRunner, IManifest, ITestResult, ITestSuiteConfig } from "rdf-test-suite";
import { LdfManifestLoader } from "./LdfManifestLoader";
import WriteStream = NodeJS.WriteStream;
import * as LogSymbols from "log-symbols";
import * as C from "./Colors";

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

    /**
   * Print the given test results to a text stream.
   * @param {WriteStream} stdout The output stream to write to.
   * @param {ITestResult[]} results An array of test results.
   * @param {boolean} compact If the results should be printed in compact-mode.
   */
  public resultsToText(stdout: WriteStream, results: ITestResult[], compact: boolean) {
    const failedTests: ITestResult[] = [];
    let success: number = 0;
    let skipped: number = 0;
    for (const result of results) {
      if (result.ok) {
        success++;
        stdout.write(`${LogSymbols.success} ${result.test.name} (${result.test.uri})\n`);
      } else {
        if (result.skipped) {
          skipped++;
          stdout.write(`${LogSymbols.info} ${result.test.name} (${result.test.uri})\n`);
        } else {
          failedTests.push(result);
          stdout.write(`${LogSymbols.error} ${result.test.name} (${result.test.uri})\n`);
        }
      }
    }

    if (!compact) {
      for (const result of failedTests) {
        stdout.write(`
${LogSymbols.error} ${C.inColor(result.test.name, C.RED)}
  ${result.test.comment || ''}
  ${result.error}
  ${C.inColor('More info:', C.BLUE)} ${result.test.uri}
`);
      }
    }

    const skippedString = skipped ? ` (skipped ${skipped})` : '';
    success += skipped;
    if (success === results.length) {
      stdout.write(`${LogSymbols.success} ${success} / ${results.length} tests succeeded!${skippedString}\n`);
    } else {
      stdout.write(`${LogSymbols.error} ${success} / ${results.length} tests succeeded!${skippedString}\n`);
    }
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