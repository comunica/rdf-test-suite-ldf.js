import { Resource } from "rdf-object";
import { IFetchOptions, IManifest, ITestCase, ITestCaseHandler,
  manifestFromSpecificationResource, Util } from "rdf-test-suite";
import { LdfResponseMockerFactory } from "./factory/LdfResponseMockerFactory";
import { ldfTestCaseFromResource } from "./testcase/ldf/ILdfTestCase";

/**
 * Create a manifest object from a resource.
 * @param {{[uri: string]: ITestCaseHandler<ITestCase<any>>}} testCaseHandlers Handlers for constructing test cases.
 * @param {IFetchOptions} options The fetch options.
 * @param {Resource} resource A resource.
 * @return {Promise<IManifest>} A promise resolving to a manifest object.
 */
export async function ldfManifestFromResource(testCaseHandlers: {[uri: string]: ITestCaseHandler<ITestCase<any>>},
                                              options: IFetchOptions, resource: Resource, startPort?: number):
  Promise<IManifest> {
  // The factory will allow each ITestCase to setup a mocking server if needed
  let factory: LdfResponseMockerFactory = new LdfResponseMockerFactory(startPort);
  let res: IManifest = {
    comment: resource.property.comment ? resource.property.comment.value : null,
    label: resource.property.label ? resource.property.label.value : null,
    specifications: resource.property.specifications ? await Util.promiseValues<IManifest>(
      Object.assign.apply({}, await Promise.all(
        resource.property.specifications.list
          .map((specificationResource: Resource) =>
            ({ [specificationResource.term.value]:
              manifestFromSpecificationResource(testCaseHandlers, options, specificationResource) }))))) : null,
    subManifests: await Promise.all<IManifest>([].concat.apply([],
      resource.properties.include.map((includeList: Resource) => includeList.list
        .map(ldfManifestFromResource.bind(null, factory, testCaseHandlers, options))))),
    testEntries: (await Promise.all<ITestCase<any>>([].concat.apply([],
      resource.properties.entries.map(
        (entryList: Resource) => entryList.list
          .map(ldfTestCaseFromResource.bind(null, factory, testCaseHandlers, options))))))
          .filter((v) => v),
    uri: resource.value,
  };
  return res;
}
