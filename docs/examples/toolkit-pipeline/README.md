# Toolkit Pipeline Example

This example illustrates the end-to-end healthcare pipeline in the Peerbits HealthTech ecosystem:
1. `@peerbits/smart-launch` executes SMART-on-FHIR authorization.
2. `@peerbits/fhir-client` fetches and submits FHIR resources.
3. `@peerbits/fhir-validator` ensures all inbound and outbound payloads are structurally valid and spec-compliant before processing.

## Running the Example

```bash
npx tsx index.ts
```
