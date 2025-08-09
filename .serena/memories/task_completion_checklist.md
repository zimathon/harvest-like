# Task Completion Checklist

When completing any development task, ensure you:

## Code Quality
1. **Run linting** to catch style issues:
   - Frontend: `npm run lint`
   - Backend: Check if linting is configured

2. **Run type checking**:
   - Frontend: `npm run build` (includes TypeScript compilation)
   - Backend: `cd server && npm run build`

3. **Run tests** if applicable:
   - E2E tests: `npm run test:e2e`
   - Backend tests: `cd server && npm test`

## Before Committing
1. Check `git status` to review changes
2. Ensure no sensitive data (passwords, API keys) in code
3. Verify no console.log statements left in production code
4. Check that imports are organized and unused imports removed

## Development Best Practices
1. Test your changes locally:
   - Frontend: `npm run dev`
   - Backend: `cd server && npm run dev`
   - Full stack: `npm run dev:all` or `npm run dev:firestore`

2. For database changes:
   - Test with both MongoDB and Firestore implementations
   - Run migration scripts if needed

3. For new features:
   - Update TypeScript types if needed
   - Add error handling
   - Consider adding tests

## Documentation
- Update README.md only if explicitly requested
- Add inline comments only for complex logic
- Keep code self-documenting with clear variable/function names

## Important Notes
- Never commit directly without user approval
- Ask for the lint/typecheck commands if not found
- Suggest writing missing commands to CLAUDE.md for future reference