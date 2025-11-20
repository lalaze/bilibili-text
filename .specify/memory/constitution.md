<!--
Sync Impact Report:
- Version change: Initial → 1.0.0
- Modified principles: N/A (initial creation)
- Added sections:
  * Core Principles (4 principles: Code Quality, Testing Standards, User Experience Consistency, Performance Requirements)
  * Development Standards
  * Quality Gates
  * Governance
- Removed sections: N/A
- Templates requiring updates:
  ✅ plan-template.md - Constitution Check section already references constitution file
  ✅ spec-template.md - Already aligned with quality and testing focus
  ✅ tasks-template.md - Already includes test-first approach and quality checkpoints
- Follow-up TODOs: None
-->

# bilibili-text Constitution

## Core Principles

### I. Code Quality (NON-NEGOTIABLE)

Code MUST be maintainable, readable, and follow established patterns. All code contributions MUST:

- Follow consistent naming conventions and formatting standards
- Include clear, concise comments for complex logic
- Avoid code duplication through proper abstraction
- Use meaningful variable and function names that express intent
- Maintain single responsibility principle for functions and modules
- Pass linting and static analysis checks without warnings

**Rationale**: High-quality code reduces technical debt, accelerates feature development, and minimizes bugs. Poor code quality compounds over time, making the codebase increasingly difficult to maintain and extend.

### II. Testing Standards (NON-NEGOTIABLE)

Test-Driven Development (TDD) is mandatory for all features. Testing MUST follow this workflow:

- Tests written FIRST before any implementation
- Tests MUST fail initially (red phase)
- Implementation written to pass tests (green phase)
- Code refactored while maintaining passing tests (refactor phase)
- Contract tests required for all public APIs and interfaces
- Integration tests required for cross-component interactions
- Unit tests required for business logic and edge cases
- Test coverage MUST be maintained above 80% for new code

**Rationale**: TDD ensures features are testable by design, catches regressions early, and serves as living documentation. Writing tests first forces clear thinking about requirements and interfaces before implementation details.

### III. User Experience Consistency

User-facing features MUST provide consistent, intuitive experiences. All user interactions MUST:

- Follow established UI/UX patterns within the project
- Provide clear, actionable error messages
- Include appropriate loading states and feedback
- Handle edge cases gracefully without exposing technical details
- Support accessibility standards (WCAG 2.1 Level AA minimum)
- Maintain consistent terminology and language across interfaces
- Include user documentation for non-trivial features

**Rationale**: Consistent UX reduces cognitive load, improves user satisfaction, and decreases support burden. Users should never feel lost or confused when interacting with the system.

### IV. Performance Requirements

Performance MUST be considered from the start, not retrofitted. All features MUST:

- Define measurable performance targets before implementation
- Avoid premature optimization but design for scalability
- Use appropriate data structures and algorithms for the problem domain
- Implement pagination for large data sets
- Use caching strategies where appropriate
- Monitor and log performance metrics
- Include performance regression tests for critical paths
- Document performance characteristics and limitations

**Rationale**: Performance issues are difficult and expensive to fix after launch. Proactive performance design prevents user frustration and reduces infrastructure costs.

## Development Standards

### Code Review Requirements

All code changes MUST undergo peer review before merging:

- At least one approval from a team member
- All automated checks (tests, linting, builds) MUST pass
- Reviewer MUST verify constitution compliance
- Security implications MUST be assessed
- Performance impact MUST be considered

### Documentation Requirements

Documentation MUST be maintained alongside code:

- Public APIs MUST include inline documentation
- Complex algorithms MUST include explanatory comments
- Architecture decisions MUST be documented in ADRs (Architecture Decision Records)
- User-facing features MUST include usage documentation
- Breaking changes MUST be documented in changelogs

### Security Standards

Security MUST be built-in, not bolted-on:

- Input validation required for all external data
- Output encoding required to prevent injection attacks
- Authentication and authorization enforced at appropriate boundaries
- Sensitive data MUST be encrypted at rest and in transit
- Dependencies MUST be kept up-to-date and scanned for vulnerabilities
- Security incidents MUST be logged and monitored

## Quality Gates

The following gates MUST be passed before code can be merged:

1. **Constitution Compliance**: All principles verified
2. **Test Coverage**: Minimum 80% coverage for new code
3. **Test Success**: All tests passing (unit, integration, contract)
4. **Static Analysis**: No linting errors or warnings
5. **Build Success**: Clean build with no errors
6. **Code Review**: At least one approval
7. **Documentation**: All required documentation present
8. **Performance**: Performance targets met or justified

## Governance

### Amendment Process

This constitution supersedes all other development practices. Amendments require:

1. Written proposal documenting the change and rationale
2. Team discussion and consensus
3. Version increment following semantic versioning
4. Update to all dependent templates and documentation
5. Communication to all team members

### Versioning Policy

Constitution versions follow semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Backward-incompatible changes, principle removals, or fundamental redefinitions
- **MINOR**: New principles added or material expansions to existing guidance
- **PATCH**: Clarifications, wording improvements, typo fixes

### Compliance Review

All pull requests and code reviews MUST verify compliance with this constitution. Violations MUST be:

- Identified and documented
- Justified with clear rationale if accepted
- Tracked in the Complexity Tracking section of plan.md
- Reviewed for potential constitution amendments if patterns emerge

### Complexity Justification

Any deviation from constitutional principles MUST be justified by demonstrating:

1. The specific problem that requires the deviation
2. Why simpler, compliant alternatives are insufficient
3. The mitigation strategy to minimize impact
4. The plan to eventually align with principles if possible

**Version**: 1.0.0 | **Ratified**: 2025-11-19 | **Last Amended**: 2025-11-19
