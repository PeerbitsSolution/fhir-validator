# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-09-07

### Added
- Structural validation for Bundles and nested Bundle resources.
- Observation period, component quantity, UCUM code, finite-number, and choice-cardinality checks.
- Transaction and batch request method/URL validation.

### Changed
- Require Node.js 20 or newer and update the test toolchain to remove known dependency vulnerabilities.

## [1.0.1] - 2026-08-19

### Fixed
- Published package was missing the `dist/` directory entirely, causing `MODULE_NOT_FOUND` on install — `dist/` was gitignored and no `prepublishOnly` build step guarded `npm publish`. Added `prepublishOnly: npm run build` so the package can no longer be published without a fresh build.
- Compiled output used extensionless relative imports (e.g. `./validate`), which fail under Node's native ESM resolver even when `dist/` is present (`ERR_MODULE_NOT_FOUND`). Added explicit `.js` extensions to all relative imports/exports across `src/` and switched `tsconfig.json` to `module`/`moduleResolution: "NodeNext"` to enforce this going forward.
- `VERSION` export was hardcoded to a stale `0.1.0`, out of sync with `package.json`.

## [1.0.0] - 2026-08-14

### Added
- Base structural and cardinality validation for 7 FHIR R4 resource types: `Patient`, `Observation`, `Encounter`, `Condition`, `Coverage`, `Claim`, and `ClaimResponse`.
- Reference target-type checking for `Reference`-typed elements against FHIR R4 specification.
- Structural verification for `Coding` and `CodeableConcept` elements.
- Pluggable profile constraints mechanism with illustrative `USCorePatientProfile` and `USCoreObservationVitalsProfile`.
- Diagnostic output aligned with FHIR `OperationOutcome.issue` format.
- Comprehensive test suite and synthetic fixtures.
- Documentation for limitations and toolkit pipeline examples.
