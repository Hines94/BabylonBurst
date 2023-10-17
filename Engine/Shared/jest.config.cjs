/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    extensionsToTreatAsEsm: [".ts"],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
        "@babylonjs/core": require.resolve("@babylonjs/core"),
        '.*/EnvVariableGatherer$': '<rootDir>/src/tests/jestMocks.ts'
    },
    transform: {
        "\\.[jt]sx?$": ["ts-jest", { 
            useESM: true, 
            isolatedModules: true, 
            tsconfig: { 
                allowJs: true, 
                checkJs: false 
            } 
        }]
    },
    transformIgnorePatterns: ["/node_modules/(?!@babylonjs)(.*)"],
};
