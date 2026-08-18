# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-14

### Added
- Base structural and cardinality validation for 7 FHIR R4 resource types: `Patient`, `Observation`, `Encounter`, `Condition`, `Coverage`, `Claim`, and `ClaimResponse`.
- Reference target-type checking for `Reference`-typed elements against FHIR R4 specification.
- Structural verification for `Coding` and `CodeableConcept` elements.
- Pluggable profile constraints mechanism with illustrative `USCorePatientProfile` and `USCoreObservationVitalsProfile`.
- Diagnostic output aligned with FHIR `OperationOutcome.issue` format.
- Comprehensive test suite and synthetic fixtures.
- Documentation for limitations and toolkit pipeline examples.
