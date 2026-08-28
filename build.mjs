import { build } from 'esbuild'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { transform } from 'lightningcss'
import { readFile } from 'node:fs/promises'

const ROOT = dirname(fileURLToPath(import.meta.url))
const ID = '@dsh-external/dsh-workspace-tree'

const PLATFORM_MODULES = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-attachment',
  '@deepseek-ai/dsh-client-schema-form',
  '@deepseek-ai/dsh-client-runtime/client',
]

/** Simple esbuild plugin for CSS Modules */
const cssModulesPlugin = {
  name: 'css-modules',
  setup(build) {
    build.onLoad({ filter: /\.module\.css$/ }, async (args) => {
      const source = await readFile(args.path)
      const { code, exports: cssExports } = transform({
        filename: args.path,
        code: source,
        cssModules: { pattern: '[hash]_[local]' },
        minify: true,
      })

      const classMap = Object.fromEntries(
        Object.entries(cssExports ?? {}).map(([k, v]) => [k, v.name]),
      )

      const tagId = `${ID}/${args.path.split('/').pop()}`
      const contents = `
const css = ${JSON.stringify(code.toString())};
const tagId = ${JSON.stringify(tagId)};
if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {
  const tag = document.createElement('style');
  tag.dataset.plugin = ${JSON.stringify(ID)};
  tag.dataset.pluginCss = tagId;
  tag.textContent = css;
  document.head.appendChild(tag);
}
export default ${JSON.stringify(classMap)};
`
      return { contents, loader: 'js' }
    })
  },
}

async function run() {
  console.log('[build.mjs] Starting build...')

  // 1. Build Host ESM bundle
  await build({
    entryPoints: [resolve(ROOT, 'src/index.ts')],
    outfile: resolve(ROOT, 'lib/index.js'),
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node18',
    external: ['@deepseek-ai/cordis', 'node:*'],
    logLevel: 'warning',
  })

  // 2. Build Client bundle
  const result = await build({
    entryPoints: [resolve(ROOT, 'src/client/index.tsx')],
    bundle: true,
    format: 'cjs',
    platform: 'browser',
    target: 'es2022',
    jsx: 'automatic',
    external: PLATFORM_MODULES,
    plugins: [cssModulesPlugin],
    write: false,
    sourcemap: 'inline',
    sourcesContent: true,
    logLevel: 'warning',
  })

  const bundle = result.outputFiles[0]
  if (!bundle) throw new Error('esbuild produced no client output')

  const wrapped = [
    `window.__ModuleLoader__.load({ id: ${JSON.stringify(ID)}, factory: (require) => {`,
    `var module = { exports: {} };`,
    `var exports = module.exports;`,
    `Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });`,
    bundle.text,
    `return module.exports;`,
    `} });`,
    '',
  ].join('\n')

  mkdirSync(resolve(ROOT, 'lib'), { recursive: true })
  writeFileSync(resolve(ROOT, 'lib/client.js'), wrapped)

  console.log(`[build.mjs] Success: lib/index.js and lib/client.js (${wrapped.length} bytes) generated.`)
}

run().catch((err) => {
  console.error('[build.mjs] Build failed:', err)
  process.exit(1)
})
