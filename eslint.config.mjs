import js from '@eslint/js'
import mochaPlugin from 'eslint-plugin-mocha'

export default [
  { ignores: ['node_modules', 'dist'], files: ['index.js', 'test/**/*.js'] },
  js.configs.recommended,
  mochaPlugin.configs.recommended,
]
