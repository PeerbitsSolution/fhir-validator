import { describe, expect, it } from 'vitest';
import { validate } from '../src/index.js';

describe('Bundle and extended Observation validation', () => {
  it('validates resources nested in a transaction Bundle', () => {
    const result = validate({ resourceType: 'Bundle', type: 'transaction', entry: [{ resource: { resourceType: 'Observation', status: 'final' }, request: { method: 'POST', url: 'Observation' } }] });
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.path.includes('Bundle.entry[0].resource.Observation.code'))).toBe(true);
  });

  it('rejects invalid periods and non-finite quantities', () => {
    const result = validate({
      resourceType: 'Observation', status: 'final', code: { coding: [{ system: 'http://loinc.org', code: '93832-4' }] },
      effectivePeriod: { start: '2026-08-16T00:00:00Z', end: '2026-08-15T00:00:00Z' },
      valueQuantity: { value: Number.POSITIVE_INFINITY, unit: 'min', system: 'http://unitsofmeasure.org', code: 'min' },
    });
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.path.endsWith('effectivePeriod'))).toBe(true);
    expect(result.issues.some((issue) => issue.path.endsWith('valueQuantity.value'))).toBe(true);
  });

  it('validates transaction request details and Observation choice cardinality', () => {
    const bundle = validate({ resourceType: 'Bundle', type: 'transaction', entry: [{ resource: { resourceType: 'Patient' }, request: { method: 'INVALID', url: '' } }] });
    expect(bundle.issues.some((issue) => issue.path.endsWith('request.method'))).toBe(true);
    expect(bundle.issues.some((issue) => issue.path.endsWith('request.url'))).toBe(true);
    const observation = validate({ resourceType: 'Observation', status: 'final', code: { coding: [{ code: 'x' }] }, effectiveDateTime: '2026-01-01T00:00:00Z', effectivePeriod: { start: '2026-01-01T00:00:00Z', end: '2026-01-01T01:00:00Z' }, valueQuantity: { value: 1 }, valueCodeableConcept: { text: 'x' } });
    expect(observation.issues.some((issue) => issue.path.endsWith('effective[x]'))).toBe(true);
    expect(observation.issues.some((issue) => issue.path.endsWith('value[x]'))).toBe(true);
  });
});
