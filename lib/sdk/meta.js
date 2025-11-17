// import packageJson from '../../package.json' with { type: "json" };

// @FIXME: use import when FF adds type="module" support
const packageJson = {
  version: '0.0.11'
}

const pluginName = 'esbuild-standalone'

const version = packageJson.version

export { version, pluginName }