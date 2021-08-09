# rdf-test-suite-ldf.js

[![Build status](https://github.com/comunica/rdf-test-suite-ldf.js/workflows/CI/badge.svg)](https://github.com/comunica/rdf-test-suite-ldf.js/actions?query=workflow%3ACI)
[![Coverage Status](https://coveralls.io/repos/github/comunica/rdf-test-suite-ldf.js/badge.svg?branch=master)](https://coveralls.io/github/comunica/rdf-test-suite-ldf.js?branch=master)
[![npm version](https://badge.fury.io/js/rdf-test-suite-ldf.svg)](https://www.npmjs.com/package/rdf-test-suite-ldf)

This is a nodejs CLI-tool which executes integration-tests on query-engines such as the [comunica-engines](https://github.com/comunica/comunica) and is based on the [rdf-test-suite.js](https://github.com/rubensworks/rdf-test-suite.js) written by [Ruben Taelman](https://github.com/rubensworks).

It uses test-manifests (you can find examples on the [manifest-ldf-tests](https://github.com/comunica/manifest-ldf-tests) repository) which are based on the [ontology-query-testing](https://github.com/comunica/ontology-query-testing) to test the integration of your engine.

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

### Basic execution

The following command executes the [sparql-manifest test suite](https://comunica.github.io/manifest-ldf-tests/sparql/sparql-manifest.ttl) on the engine: `myengine.js`:

```bash
$ rdf-test-suite-ldf myengine.js https://comunica.github.io/manifest-ldf-tests/sparql/sparql-manifest.ttl
```

This command will output something like this:

```bash
✔ SELECT - DBpedia TPF (https://comunica.github.io/manifest-ldf-tests/sparql/sparql-manifest.ttl#directors01)
✔ SELECT - DBpedia TPF (https://comunica.github.io/manifest-ldf-tests/sparql/sparql-manifest.ttl#software02)
✔ SELECT - DBPedia TPF & SPARQL (https://comunica.github.io/manifest-ldf-tests/sparql/sparql-manifest.ttl#simple03)
✔ 3 / 3 tests succeeded!
```

### Start port for mocking

With the `-r` flag you can decide on which port mock-servers will spawn, e.g. 5000. If an invalid port is given an error will be thrown. If the port is in use `rdf-test-suite-ldf` will wailt for a specific amount of time if the port becomes available. If it doesn't it will throw an error.

```bash
$ rdf-test-suite-ldf myengine.js https://comunica.github.io/manifest-ldf-tests/sparql/sparql-manifest.ttl -r 6000
```

### Extra details on HTTP caching

The `-c` flag inherited from [rdf-test-suite.js](https://github.com/rubensworks/rdf-test-suite.js) does also work in `rdf-test-suite-ldf`, especially for HDT- and RDFJS-testing. All the files for HDT- and RDFJS-testing should and will be (temporarily) stored in the given local cache folder. These files are deleted by default but when the `-c` flag is given, all those files will be stored in the directory given with this flag. These files can be used the next time to avoid re-fetching files from servers.

```bash
$ rdf-test-suite-ldf myengine.js https://comunica.github.io/manifest-ldf-tests/sparql/sparql-manifest.ttl -c path/to/dir
```

### Delay server termination

With the `-v` flag you can define the time to wait before stopping the server after each completed test.
This is useful in case your engine could perform additional HTTP to the server, even after the query has been done.

```bash
$ rdf-test-suite-ldf myengine.js https://comunica.github.io/manifest-ldf-tests/sparql/sparql-manifest.ttl -v 100
```

Defaults to `10`.

### Extra options

A list of extra options, inherited from [rdf-test-suite.js](https://github.com/rubensworks/rdf-test-suite.js) can be found [here](https://github.com/rubensworks/rdf-test-suite.js/blob/master/README.md#test-filtering).

## Some default test suites

I created and published some test-suites for the 4 engines of [comunica](https://github.com/comunica/comunica) which can be found [here](https://comunica.github.io/manifest-ldf-tests/).

## License

This software is written by [Manu De Buck](https://github.com/ManuDeBuck) and based on software written by [Ruben Taelman](https://github.com/rubensworks). This code is released under the [MIT license](https://github.com/comunica/rdf-test-suite-ldf.js/blob/master/LICENSE).
