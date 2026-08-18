# @peerbits/fhir-validator

> Fast, lightweight structural, cardinality, and reference validation for FHIR R4 resources.

[![CI](https://github.com/PeerbitsSolution/fhir-validator/actions/workflows/ci.yml/badge.svg)](https://github.com/PeerbitsSolution/fhir-validator/actions)
[![CodeQL](https://github.com/PeerbitsSolution/fhir-validator/actions/workflows/codeql.yml/badge.svg)](https://github.com/PeerbitsSolution/fhir-validator/actions)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

> [!IMPORTANT]
> **Scope & Positioning**: `@peerbits/fhir-validator` is a fast in-memory **structural and reference validator** for FHIR R4 resources. It is **not** a full FHIR profile conformance engine, does not evaluate FHIRPath invariant expressions, and is not an ONC certification test kit.
>
> **Read our [Known Limitations](docs/KNOWN_LIMITATIONS.md)** for a clear overview of supported checks vs. out-of-scope capabilities and recommended full-conformance alternatives.

---

## The Peerbits HealthTech Toolkit Narrative

`@peerbits/fhir-validator` works seamlessly alongside the rest of the Peerbits Open Source healthcare stack:

1. **[`@peerbits/smart-launch`](../smart-launch)** — Performs EHR SMART-on-FHIR OAuth2 / OIDC discovery and authorization.
2. **[`@peerbits/fhir-client`](../fhir-client)** — Connects to FHIR servers and executes type-safe CRUD, searches, and batch bundles.
3. **`@peerbits/fhir-validator`** — Inspects and verifies payload integrity at runtime, catching missing fields, invalid references, and malformed codings before requests hit the wire or database.

---

## Features

- **Zero-Dependency & In-Memory**: Pure TypeScript with zero runtime dependencies. Runs in Node.js, browsers, Edge workers, and Lambda functions.
- **7 Core Resource Types**: Base structural rules and cardinality checks for:
  - `Patient`
  - `Observation`
  - `Encounter`
  - `Condition`
  - `Coverage`
  - `Claim`
  - `ClaimResponse`
- **Reference Target-Type Enforcement**: Checks that `Reference` elements target allowed resource types per the FHIR R4 specification.
- **Coding & CodeableConcept Shape Verification**: Structural validation of `code` and URI `system` fields without heavy external network calls.
- **Pluggable Profile Constraints**: Declaratively enforce additional required fields, cardinality minimums, and fixed values on top of base specifications (includes illustrative `USCorePatientProfile` and `USCoreObservationVitalsProfile`).
- **OperationOutcome-Aligned Output**: Returns `{ valid: boolean, issues: ValidationIssue[] }` with diagnostic severities (`error`, `warning`, `information`).

---

## Installation

```bash
npm install @peerbits/fhir-validator
```

---

## Quick Start

### 1. Validating a Resource

```typescript
import { validate } from "@peerbits/fhir-validator";

const observation = {
  resourceType: "Observation",
  id: "heart-rate-001",
  status: "final",
  code: {
    coding: [
      {
        system: "http://loinc.org",
        code: "8867-4",
        display: "Heart rate",
      },
    ],
  },
  subject: {
    reference: "Patient/synthetic-patient-001",
  },
  valueQuantity: {
    value: 72,
    unit: "/min",
    system: "http://unitsofmeasure.org",
    code: "/min",
  },
};

const result = validate(observation);
console.log(result.valid); // true
console.log(result.issues); // []
```

### 2. Catching Structural Errors (Before / After)

When passed a resource with deliberate errors:

```typescript
import { validate } from "@peerbits/fhir-validator";

const malformedObservation = {
  resourceType: "Observation",
  // 1. Missing required 'status'
  code: {
    coding: [
      {
        // 2. Missing required 'system' URI
        code: "8867-4",
      },
    ],
  },
  subject: {
    // 3. Disallowed target resource type for Observation.subject
    reference: "Claim/claim-999",
  },
};

const result = validate(malformedObservation);
console.log(result.valid); // false
console.log(result.issues);
```

**Result Output (`ValidationIssue[]`):**

```json
{
  "valid": false,
  "issues": [
    {
      "severity": "error",
      "path": "Observation.status",
      "code": "required",
      "message": "Missing required 'status' in 'Observation'."
    },
    {
      "severity": "error",
      "path": "Observation.code.coding[0].system",
      "code": "required",
      "message": "Missing required 'system' URI in 'Observation.code.coding[0]'."
    },
    {
      "severity": "error",
      "path": "Observation.subject",
      "code": "invalid-reference-type",
      "message": "Reference at 'Observation.subject' targets disallowed resource type 'Claim'. Allowed types: Patient, Group, Device, Location."
    }
  ]
}
```

---

## Applying Profile Constraints

You can pass profile constraints to enforce additional requirements beyond base FHIR:

```typescript
import { validate, USCorePatientProfile } from "@peerbits/fhir-validator";

const minimalPatient = {
  resourceType: "Patient",
  id: "patient-1",
  gender: "female",
};

// Base validation passes (since name & identifier are optional in base FHIR R4)
const baseResult = validate(minimalPatient);
console.log(baseResult.valid); // true

// US Core Patient requires name and identifier
const profileResult = validate(minimalPatient, { profile: USCorePatientProfile });
console.log(profileResult.valid); // false
console.log(profileResult.issues);
// => Issues flagging missing 'Patient.identifier' and 'Patient.name'
```

---

## API Reference

### `validate(resource: unknown, options?: ValidateOptions): ValidationResult`

Validates any JSON object against base FHIR R4 rules and optional profile constraints.

#### `ValidationResult`
- `valid: boolean` — `true` if zero issues with `severity: "error"` were found.
- `issues: ValidationIssue[]` — List of validation issues.

#### `ValidationIssue`
- `severity: "error" | "warning" | "information"`
- `path: string` — Dot-notated element path (e.g. `Observation.code.coding[0].system`).
- `code: string` — Machine-readable issue code (e.g. `required`, `invalid-type`, `invalid-reference-type`).
- `message: string` — Human-readable description.

---

## Contributing & Development

```bash
# Install dependencies
npm install

# Run test suite
npm test

# Type check
npm run typecheck

# Build bundle
npm run build
```

---

## License

[Apache 2.0](LICENSE) © Peerbits
