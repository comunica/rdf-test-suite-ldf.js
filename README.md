# rdf-test-suite-ldf.js

This is a nodejs CLI-tool which executes integration-tests on query-engines such as the [comunica-engines](https://github.com/comunica/comunica) and is based on the [rdf-test-suite.js](https://github.com/rubensworks/rdf-test-suite.js) written by [Ruben Taelman](https://github.com/rubensworks).

It uses test-manifests (you can find examples on the ontology-query-testing_ repository) which are based on the [ontology-query-testing](https://github.com/comunica/ontology-query-testing) to test the integration of your engine.

## Installation

Either install it globally:

```bash
$ yarn global add rdf-test-suite-ldf
```

or locally (as a dev dependency):

```bash
$ yarn add --dev rdf-test-suite-ldf
```

## Usage

When the `rdf-test-suite-ldf` script is installed you're good to go. You will need some kind of javascript-_engine_ which follows the [`ILdfQueryEngine`](https://github.com/comunica/rdf-test-suite-ldf.js/blob/master/lib/testcase/ldf/ILdfQueryEngine.ts) interface as first argument and an engine-test manifest URI as second argument.

Example engines based on the [comunica](https://github.com/comunica/comunica#readme) query engine platform can be found [here](https://github.com/comunica/comunica-engines). Example test-suites **(with failing tests, used for testing-purposes)** can be found [here](https://comunica.github.io/ontology-query-testing/examples/ldf-manifest.ttl) and [here](https://comunica.github.io/ontology-query-testing/examples/file-manifest.ttl). 

### Basic execution

The following command executes the [tpf-manifest test suite](#TODO) on the engine: `myengine.js`:

```bash
$ rdf-test-suite-ldf myengine.js http://comunica.github.io/ontology-query-testing/examples/ldf-manifest.ttl
```

This command will output something like this:

```bash
✔ constructwhere01 - CONSTRUCT WHERE (https://comunica.github.io/ontology-query-testing/examples/construct-manifest.ttl#constructwhere01)
✖ constructwhere02 - CONSTRUCT WHERE SHOULD FAIL (https://comunica.github.io/ontology-query-testing/examples/construct-manifest.ttl#constructwhere02)
  Query: PREFIX : <http://example.org/>

CONSTRUCT WHERE { ?s ?p ?o}

  Data: https://comunica.github.io/ontology-query-testing/examples/data.ttl
  
  Result Source: https://comunica.github.io/ontology-query-testing/examples/constructwhere02result.ttl
  
  Expected: ...

  Got: ...

  More info: https://comunica.github.io/ontology-query-testing/examples/construct-manifest.ttl#constructwhere02

✖ 1 / 2 tests succeeded!
```

### Start port for mocking

With the `-r` flag you can decide on which port mock-servers start spawning, e.g. 5000. If an invalid port is given or if not enough (consecutive) ports are available an error will be thrown.

```
$ rdf-test-suite-ldf myengine.js http://comunica.github.io/ontology-query-testing/examples/ldf-manifest.ttl -r 6000
```

### Extra details on HTTP caching

The `-c` flag inherited from [rdf-test-suite.js](https://github.com/rubensworks/rdf-test-suite.js) does also work in **rdf-test-suite-ldf**. For HDT- and RDFJS-testing files should and will be (temporarily) stored in local memory. These files will be deleted by default but when the `-c` flag is given, all those files will be stored in the directory given with this flag. These files can be used the next time to avoid re-fetching files from servers.

### Extra options

A list of extra options, inherited from [rdf-test-suite.js](https://github.com/rubensworks/rdf-test-suite.js) can be found [here](https://github.com/rubensworks/rdf-test-suite.js/blob/master/README.md#test-filtering).

```
$ rdf-test-suite-ldf myengine.js http://comunica.github.io/ontology-query-testing/examples/ldf-manifest.ttl -c path/to/dir
```

## Some default test suites

I will create and publish some default test-suites which can be found [here](https://github.com/comunica/ontology-query-testing/tree/master/examples)

## License

This software is written by [Manu De Buck](https://github.com/ManuDeBuck) and based on software written by [Ruben Taelman](https://github.com/rubensworks). This code is released under the [MIT license](https://github.com/comunica/rdf-test-suite-ldf.js/blob/master/LICENSE).