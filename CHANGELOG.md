# Changelog
All notable changes to this project will be documented in this file.

<a name="v1.3.0"></a>
## [v1.3.0](https://github.com/comunica/rdf-test-suite-ldf.js/compare/v1.2.0...v1.3.0) - 2020-10-23

### Changed
* [Update to latest rdf-test-suite](https://github.com/comunica/rdf-test-suite-ldf.js/commit/99774ae282c307a5230bb14662efedd0c9d6519e)

<a name="v1.2.0"></a>
## [v1.2.0](https://github.com/comunica/rdf-test-suite-ldf.js/compare/v1.1.4...v1.2.0) - 2020-10-23

### Added
* [Add option to delay server termination](https://github.com/comunica/rdf-test-suite-ldf.js/commit/d87006086e788f5fe23f7cfcfd001f20ef321f7b)

<a name="v1.1.5"></a>
## [v1.1.5](https://github.com/comunica/rdf-test-suite-ldf.js/compare/v1.1.4...v1.1.5) - 2020-03-30

### Fixed
* [Fix 404s freezing application](https://github.com/comunica/rdf-test-suite-ldf.js/commit/05411159aa2637b1365bac1c4469a63ea621400d)

<a name="v1.1.4"></a>
## [v1.1.4](https://github.com/comunica/rdf-test-suite-ldf.js/compare/v1.1.3...v1.1.4) - 2019-12-06

### Fixed
* [Fix temp files being read before writing finished](https://github.com/comunica/rdf-test-suite-ldf.js/commit/36a5927dfb962f07af879385e5660ab382a60f2f)

### Changed
* [Bump to rdf-test-suite 1.10.5 to fix caching issues with binary files](https://github.com/comunica/rdf-test-suite-ldf.js/commit/d6c1347ea4c61a68a362d76549442e35cd411699)

<a name="v1.1.3"></a>
## [v1.1.3](https://github.com/comunica/rdf-test-suite-ldf.js/compare/v1.1.2...v1.1.3) - 2019-09-27

### Added
* [Show unmocked URL when mocked URL fetching fails](https://github.com/comunica/rdf-test-suite-ldf.js/commit/3170525b2f4a298fd43a738373fa8af92d3e050f)

### Fixed
* [Fix some mocked responses failing](https://github.com/comunica/rdf-test-suite-ldf.js/commit/94857910f78cf8f9b41540c73b54b502ef032ca6)
* [Fix fetch options not always being passed](https://github.com/comunica/rdf-test-suite-ldf.js/commit/fa3abff3fc50dccac24e48e06e60b49ca610f56d)
* [Fix not all resources being cached](https://github.com/comunica/rdf-test-suite-ldf.js/commit/5d6e863b754033ef0db4c19e1afe5bb5f3f302b1)

<a name="v1.1.2"></a>
## [v1.1.2](https://github.com/comunica/rdf-test-suite-ldf.js/compare/v1.1.1...v1.1.2) - 2019-09-19

### Fixed
* [Fix requests failing on Node 8 and lower](https://github.com/comunica/rdf-test-suite-ldf.js/commit/9774f112197d2eeaf3e8cb57275ec7931b362325)

<a name="v1.1.1"></a>
## [v1.1.1](https://github.com/comunica/rdf-test-suite-ldf.js/compare/v1.1.0...v1.1.1) - 2019-09-18

### Fixed
* [Fix edge case causing crashes with headers, closes #26](https://github.com/comunica/rdf-test-suite-ldf.js/commit/62ad2f65ec129f91a9a1dc10ecc08585175ddf98)

<a name="v1.1.0"></a>
## [v1.1.0](https://github.com/comunica/rdf-test-suite-ldf.js/compare/v1.0.0...v1.1.0) - 2019-09-17

### Changed
* [Make query engines independent of comunica](https://github.com/comunica/rdf-test-suite-ldf.js/commit/13cec56d9421cb4ffaf6acd75699b5196595085a)
* [Make LdfResponseMocker tests comunica-independent](https://github.com/comunica/rdf-test-suite-ldf.js/commit/16b6a8002f1bacaf1b5f03f47330b3a3f0d9c9f7)
* [Improve error message when mocked URLs return a 404](https://github.com/comunica/rdf-test-suite-ldf.js/commit/d97d28f9574c9d802783b7a3d7b261d3ddb5c685)
* [Disable keep-alive headers to speedup testing](https://github.com/comunica/rdf-test-suite-ldf.js/commit/564e8cd3e4b9f9f58465351694650f4990400e1d)

### Fixed
* [Update nock to 11.3.2, Closes #25](https://github.com/comunica/rdf-test-suite-ldf.js/commit/4466b4581608100a557c48c11a65e0f3989c6d23)

<a name="v1.0.0"></a>
## [v1.0.0] - 2019-09-03

Initial release
