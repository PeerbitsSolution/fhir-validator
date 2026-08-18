# Known Limitations

**`fhir-validator` is a fast, lightweight structural and reference validator for FHIR R4 resources, not a full FHIR profile conformance or ONC certification engine.**

This document details what this library checks and what it deliberately does not attempt, helping you choose the right tool for your interoperability architecture.

---

## What this library checks

- **Base Structural Validation**: Required elements, value types, and cardinality constraints for 7 core FHIR R4 resource types (`Patient`, `Observation`, `Encounter`, `Condition`, `Coverage`, `Claim`, `ClaimResponse`).
- **Reference Target-Type Validation**: Verifies that `Reference` elements point to valid, spec-compliant target resource types (e.g. ensuring `Observation.subject` references `Patient`, `Group`, `Device`, or `Location`, rather than an unrelated resource).
- **Coding & CodeableConcept Structural Integrity**: Verifies that `Coding` objects have non-empty `code` strings and valid URI `system` identifiers, and that `CodeableConcept` structures contain valid `coding` arrays.
- **Pluggable Profile Constraints**: Supports lightweight declarative constraint rules (extra required fields, cardinality minimums/maximums, and fixed pattern values) such as the illustrative `USCorePatientProfile` and `USCoreObservationVitalsProfile`.
- **Standardized Diagnostic Output**: Produces clean issue objects with `severity` (`error`, `warning`, `information`), `path`, `code`, and human-readable `message`, matching the logical shape of FHIR's `OperationOutcome`.

---

## What this library does NOT check

- **FHIRPath Invariant Expressions**: Does not evaluate embedded FHIRPath invariants (e.g. `obs-6: dataAbsentReason SHALL only be present if value[x] is not present`). Full invariant evaluation requires an external FHIRPath engine.
- **Live Terminology Server Lookups**: Does not perform remote `$validate-code` requests against live SNOMED CT, LOINC, or RxNorm terminology servers.
- **Arbitrary Implementation Guide (.tgz / StructureDefinition) Parsing**: Does not load raw FHIR StructureDefinition XML/JSON bundles dynamically from the FHIR registry.
- **ONC Health IT Certification Suitability**: This library is built for fast runtime and pre-flight validation in applications, clients, and pipelines. It is not an ONC/Inferno conformance testing suite.

---

## Recommended tools for full conformance & certification

If your use case requires deep FHIRPath invariant evaluation, dynamic IG parsing, or official ONC test compliance, use these tools:

1. **[Official HL7 FHIR Validator (Java)](https://confluence.hl7.org/display/FHIR/Using+the+FHIR+Validator)** — The reference validator maintained by HL7 for full IG and conformance validation.
2. **[Firely .NET SDK / Validator](https://fire.ly/products/firely-net-sdk/)** — Comprehensive FHIR specification and profile validation suite.
3. **[ONC Inferno Framework](https://inferno.healthit.gov/)** — The official testing harness for ONC (g)(10) Standardized API certification.
