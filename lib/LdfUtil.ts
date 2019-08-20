/**
 * A class with utility functions.
 */
export class LdfUtil {
  
  /**
   * Removes the prefix of a resource. Presuming the prefix ends wih '#'
   * @param resourceIRI A string representing the IRI of the resource
   */
  public static removePrefix(resourceIRI: string) : string {
    if(resourceIRI.indexOf('#') > 0){
      return resourceIRI.substring(resourceIRI.indexOf('#') + 1,resourceIRI.length);
    }
    // else: not implemented.
    return resourceIRI;
  }

}