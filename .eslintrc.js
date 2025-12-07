// ═══════════════════════════════════════════════════════════════
// ESLINT CONFIGURATION
// Linting para TypeScript + Node.js
// ═══════════════════════════════════════════════════════════════

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  rules: {
    // ═══════════════════════════════════════════════════════════
    // TypeScript Rules
    // ═══════════════════════════════════════════════════════════
    '@typescript-eslint/no-explicit-any': 'off', // Permitir 'any' en backend (común en Express)
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrors: 'none', // Ignorar variables en catch blocks
      },
    ],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off', // Permitir !  assertions cuando sabemos que no es null
    '@typescript-eslint/ban-ts-comment': 'warn', // Solo warning para @ts-expect-error

    // ═══════════════════════════════════════════════════════════
    // General Rules
    // ═══════════════════════════════════════════════════════════
    'no-console': 'off', // Permitir console.log en backend
    'no-debugger': 'warn',
    'no-var': 'error',
    'prefer-const': 'warn',
    'prefer-arrow-callback': 'warn',
    'no-return-await': 'off', // A veces es útil para debugging y error handling

    // ═══════════════════════════════════════════════════════════
    // Prettier Integration
    // ═══════════════════════════════════════════════════════════
    'prettier/prettier': [
      'warn',
      {
        endOfLine: 'auto',
      },
    ],
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '*.js', // Ignorar archivos JS legacy
    'prisma/migrations/',
    'prisma/**/*',
    'scripts/**/*',
  ],
};