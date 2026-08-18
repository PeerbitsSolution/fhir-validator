/**
 * Toolkit Pipeline Narrative Example:
 * 1. smart-launch handles SMART on FHIR OAuth2 discovery and authorization.
 * 2. fhir-client makes authenticated FHIR API requests.
 * 3. fhir-validator inspects and verifies inbound / outbound FHIR payload integrity.
 */

import { validate, USCoreObservationVitalsProfile } from "@peerbits/fhir-validator";

// Simulated incoming FHIR Observation payload retrieved via fhir-client
async function handleIncomingObservation(rawPayload: unknown) {
  console.log("1. Validating incoming resource integrity...");
  const result = validate(rawPayload, { profile: USCoreObservationVitalsProfile });

  if (!result.valid) {
    console.error("❌ Pre-flight validation failed! Rejecting payload before database storage:");
    result.issues.forEach((issue) => {
      console.error(`   - [${issue.severity}] at ${issue.path}: ${issue.message}`);
    });
    throw new Error("Invalid FHIR Resource");
  }

  console.log("✅ Resource passed structural and profile checks. Ready for clinical workflow consumption.");
  return rawPayload;
}

// Sample run
const sampleObs = {
  resourceType: "Observation",
  id: "vital-bp-001",
  status: "final",
  category: [
    {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/observation-category",
          code: "vital-signs",
          display: "Vital Signs",
        },
      ],
    },
  ],
  code: {
    coding: [
      {
        system: "http://loinc.org",
        code: "85354-9",
        display: "Blood pressure panel with all children optional",
      },
    ],
  },
  subject: {
    reference: "Patient/synthetic-patient-001",
  },
  effectiveDateTime: "2026-08-14T10:00:00Z",
  component: [
    {
      code: {
        coding: [{ system: "http://loinc.org", code: "8480-6", display: "Systolic blood pressure" }],
      },
      valueQuantity: { value: 120, unit: "mmHg", system: "http://unitsofmeasure.org", code: "mm[Hg]" },
    },
    {
      code: {
        coding: [{ system: "http://loinc.org", code: "8462-4", display: "Diastolic blood pressure" }],
      },
      valueQuantity: { value: 80, unit: "mmHg", system: "http://unitsofmeasure.org", code: "mm[Hg]" },
    },
  ],
};

handleIncomingObservation(sampleObs);
