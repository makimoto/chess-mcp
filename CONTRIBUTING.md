# Contributing to Chess MCP

Thank you for your interest in contributing to Chess MCP! This document provides guidelines and
instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Submitting Changes](#submitting-changes)
- [Code Style](#code-style)
- [Testing](#testing)
- [Reporting Issues](#reporting-issues)
- [Feature Requests](#feature-requests)

## Code of Conduct

This project adheres to a code of conduct that promotes a welcoming and inclusive environment for
all contributors. Please be respectful and considerate in all interactions.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm
- Git

### Setting Up Your Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:

   ```bash
   git clone https://github.com/your-username/chess-mcp.git
   cd chess-mcp
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Run tests to ensure everything is working:

   ```bash
   npm test
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Development Process

### Branch Naming Convention

- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test improvements

### Commit Message Format

Follow the conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:

- `feat(mcp): add move validation tool`
- `fix(game): resolve draw detection issue`
- `docs(readme): update installation instructions`

### Development Workflow

1. Create a new branch from `main`:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the coding standards
3. Write or update tests for your changes
4. Ensure all tests pass:

   ```bash
   npm test
   ```

5. Run linting and formatting:

   ```bash
   npm run lint
   npm run format
   ```

6. Run type checking:

   ```bash
   npm run typecheck
   ```

7. Commit your changes with a descriptive message
8. Push to your fork and create a pull request

## Submitting Changes

### Pull Request Process

1. Ensure your PR addresses a specific issue or feature
2. Update documentation if necessary
3. Add tests for new functionality
4. Ensure all tests pass and code quality checks are green
5. Write a clear PR description explaining:
   - What changes were made
   - Why the changes were necessary
   - How to test the changes
   - Any breaking changes

### PR Review Process

- All PRs require review from at least one maintainer
- Address any feedback promptly
- Keep your PR up to date with the main branch
- Be responsive to comments and questions

## Code Style

### TypeScript Guidelines

- Use TypeScript for all new code
- Follow the existing type definitions and patterns
- Use strict type checking
- Prefer interfaces over types where appropriate
- Use proper access modifiers (public, private, protected)

### General Guidelines

- Use meaningful variable and function names
- Keep functions small and focused
- Add comments for complex logic
- Follow the existing code structure and patterns
- Use ESLint and Prettier configurations

### File Organization

```
src/
├── core/          # Core game logic
│   ├── game/      # Game management
│   ├── chess/     # Chess engine
│   └── storage/   # Storage adapters
├── mcp/           # MCP server implementation
├── types/         # Type definitions
└── constants/     # Constants and configurations
```

## Testing

### Test Structure

- Unit tests for individual components
- Integration tests for component interactions
- Test files should be named `*.test.ts`
- Tests should be placed in the `tests/` directory

### Writing Tests

```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test input';

      // Act
      const result = component.method(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testNamePattern="TestName"
```

## Reporting Issues

### Before Reporting

1. Check if the issue already exists in the issue tracker
2. Try to reproduce the issue with the latest version
3. Gather as much information as possible

### Issue Template

When reporting bugs, please include:

- **Description**: Clear description of the issue
- **Steps to Reproduce**: Detailed steps to reproduce the behavior
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Environment**:
  - OS version
  - Node.js version
  - Package version
- **Additional Context**: Any other relevant information

### Security Issues

For security vulnerabilities, please do not open a public issue. Instead, email the maintainers
directly.

## Feature Requests

### Before Requesting

1. Check if the feature already exists or is planned
2. Consider if the feature fits the project's scope
3. Think about the implementation approach

### Feature Request Template

- **Feature Description**: Clear description of the proposed feature
- **Use Case**: Why this feature would be valuable
- **Proposed Implementation**: How you think it should work
- **Alternatives**: Any alternative approaches considered

## Development Guidelines

### Architecture Principles

1. **Modularity**: Keep components focused and loosely coupled
2. **Testability**: Write code that is easy to test
3. **Type Safety**: Use TypeScript effectively
4. **Error Handling**: Implement proper error handling
5. **Documentation**: Document public APIs and complex logic

### Performance Considerations

- Consider memory usage, especially for long-running games
- Optimize database queries where applicable
- Use appropriate data structures
- Profile performance for critical paths

### MCP Protocol

When working with MCP-related code:

- Follow the MCP specification
- Ensure proper error handling and validation
- Test with actual MCP clients
- Document tool parameters and responses

## Getting Help

- **GitHub Discussions**: For general questions and discussions
- **GitHub Issues**: For bug reports and feature requests
- **Code Review**: Don't hesitate to ask for review on complex changes

## Recognition

Contributors will be recognized in the project's documentation and release notes. Thank you for
helping make Chess MCP better!

---

By contributing to Chess MCP, you agree that your contributions will be licensed under the MIT
License.
