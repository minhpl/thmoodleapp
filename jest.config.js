const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig');

module.exports = {
    preset: 'jest-preset-angular',
    setupFilesAfterEnv: ['<rootDir>/src/testing/setup.ts'],
    testMatch: ['**/?(*.)test.ts'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.{test,stories}.ts',
        '!src/assets/**/*',
        '!src/testing/**/*',
        '!src/storybook/**/*',
        '!src/core/initializers/index.ts',
        '!src/core/features/emulators/services/zip.ts',
    ],
    transformIgnorePatterns: ['node_modules/(?!@stencil|@angular|@ionic|@moodlehq|@ngx-translate|@awesome-cordova-plugins|swiper)'],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/src/' }),
};
