import type { ValidationIssue } from '../types.js';

const BUNDLE_TYPES = ['document', 'message', 'transaction', 'transaction-response', 'batch', 'batch-response', 'history', 'searchset', 'collection'];

export function validateBundle(resource: Record<string, unknown>, path = 'Bundle'): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (resource.resourceType !== 'Bundle') issues.push({ severity: 'error', path: `${path}.resourceType`, code: 'invalid-resource-type', message: "Expected resourceType 'Bundle'." });
  if (typeof resource.type !== 'string' || !BUNDLE_TYPES.includes(resource.type)) {
    issues.push({ severity: 'error', path: `${path}.type`, code: 'invalid-value', message: `Bundle.type must be one of: ${BUNDLE_TYPES.join(', ')}.` });
  }
  if (resource.entry !== undefined && !Array.isArray(resource.entry)) {
    issues.push({ severity: 'error', path: `${path}.entry`, code: 'invalid-type', message: 'Bundle.entry must be an array.' });
  }
  if (Array.isArray(resource.entry)) {
    resource.entry.forEach((entry, index) => {
      const entryPath = `${path}.entry[${index}]`;
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        issues.push({ severity: 'error', path: entryPath, code: 'invalid-structure', message: 'Bundle entry must be an object.' });
        return;
      }
      const value = entry as Record<string, unknown>;
      if (!value.resource || typeof value.resource !== 'object' || Array.isArray(value.resource)) {
        issues.push({ severity: 'error', path: `${entryPath}.resource`, code: 'required', message: 'Bundle entry requires a resource object.' });
      }
      if (resource.type === 'transaction' || resource.type === 'batch') {
        if (!value.request || typeof value.request !== 'object' || Array.isArray(value.request)) {
          issues.push({ severity: 'error', path: `${entryPath}.request`, code: 'required', message: `${resource.type} Bundle entry requires request.` });
        } else {
          const request = value.request as Record<string, unknown>;
          const methods = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH'];
          if (typeof request.method !== 'string' || !methods.includes(request.method)) {
            issues.push({ severity: 'error', path: `${entryPath}.request.method`, code: 'invalid-value', message: `Bundle request.method must be one of: ${methods.join(', ')}.` });
          }
          if (typeof request.url !== 'string' || !request.url.trim()) {
            issues.push({ severity: 'error', path: `${entryPath}.request.url`, code: 'required', message: 'Bundle request.url must be a non-empty string.' });
          }
        }
      }
    });
  }
  return issues;
}
