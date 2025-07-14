module.exports = {
    root: true,
    extends: ["@react-native", "plugin:react/recommended"],
    plugins: ["prettier"],
    rules: {
        "prettier/prettier": [
            "warn",
            {
                singleQuote: false,
                semi: true,
                trailingComma: "all",
            },
        ],
    },
};
