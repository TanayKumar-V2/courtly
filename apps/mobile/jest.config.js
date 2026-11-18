module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@courtly/shared$': '<rootDir>/../../packages/shared/src/index.ts',
  },
};
