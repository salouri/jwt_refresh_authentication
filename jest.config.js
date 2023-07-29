/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  verbose: true,
  globals: {
    'ts-jest': {
      tsconfig: {
        rootDir: '.',
      },
    },
  },
};

export default config;
