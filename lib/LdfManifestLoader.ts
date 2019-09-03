import { RdfObjectLoader, Resource } from "rdf-object";
import { IFetchOptions, IManifest, IManifestLoaderArgs, ITestCase,
  ITestCaseHandler, ManifestLoader } from "rdf-test-suite";
import { logger } from "./factory/Logger";
import { ldfManifestFromResource } from "./ILdfManifest";

export class LdfManifestLoader extends ManifestLoader {

  // Overwrite default test case handlers and loader context
  public static readonly DEFAULT_TEST_CASE_HANDLERS: {[uri: string]: ITestCaseHandler<ITestCase<any>>} =
    require('./testcase/LdfTestCaseHandlers');
  public static readonly LOADER_CONTEXT = require('./context-manifest.json');

  private readonly ldfTestCaseHandlers: {[uri: string]: ITestCaseHandler<ITestCase<any>>};

  constructor(args?: IManifestLoaderArgs) {
    super(args);
    if (!args) {
      args = {};
    }
    this.ldfTestCaseHandlers = args.testCaseHandlers || LdfManifestLoader.DEFAULT_TEST_CASE_HANDLERS;
  }

  /**
   * Load the manifest from the given URL.
   * @param {string} url The URL of a manifest.
   * @param {IFetchOptions} options The fetch options.
   * @return {Promise<IManifest>} A promise that resolves to a manifest object.
   */
  public async from(url: string, options?: IFetchOptions, startPort?: number): Promise<IManifest> {
    logger.info(`Loading objectloader for manifest creation`);
    const objectLoader = new RdfObjectLoader({ context: LdfManifestLoader.LOADER_CONTEXT });
    logger.info(`Importing manifest `);
    const manifest: Resource = await this.import(objectLoader, url, options);
    return ldfManifestFromResource(this.ldfTestCaseHandlers, options, manifest, startPort);
  }

}
