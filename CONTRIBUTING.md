# Contributing to fhir-validator

Thank you for your interest in contributing to `@peerbits/fhir-validator`!

## Getting Started

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/PeerbitsSolution/fhir-validator.git
   cd fhir-validator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the test suite:
   ```bash
   npm test
   ```

4. Check types:
   ```bash
   npm run typecheck
   ```

## Development Guidelines

- Ground every base structural rule in the official **FHIR R4 base specification**.
- Do not claim or add heavy dynamic FHIRPath / terminology server dependencies. Review [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md) before submitting PRs that affect scope.
- Maintain synthetic fixtures with zero PHI/PII.

## Submitting Pull Requests

1. Ensure all tests pass (`npm test`) and typecheck cleanly (`npm run typecheck`).
2. Include unit tests for any new validation rule or resource definition.
3. Open a pull request against `master`.

## License

By contributing, you agree that your contributions will be licensed under the [Apache 2.0 License](LICENSE).
