// functions/.eslintrc.js

module.exports = {
  root: true,
  env: {
    es6: true,
    node: true, // <-- This is the most important line we are adding.
  },
  extends: ["eslint:recommended", "google"],
  rules: {
    quotes: ["error", "double"],
  },
  parserOptions: {
    // Required for modern JavaScript features
    ecmaVersion: 2020,
  },
};
