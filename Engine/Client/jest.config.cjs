/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    extensionsToTreatAsEsm: [".ts"],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
        "@babylonjs/core": require.resolve("@babylonjs/core"),
    },
    transform: { "\\.[jt]sx?$": ["ts-jest", { useESM: true }] },
    transformIgnorePatterns: ["/node_modules/(?!@babylonjs)(.*)"],
    globals: {
        "ts-jest": {
            isolatedModules: true, // to make type check faster
            tsConfig: {
                // to have tsc transform .js files
                allowJs: true,
                checkJs: false,
            },
        },
    },
};
