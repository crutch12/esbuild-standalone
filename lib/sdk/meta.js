import packageJson from '../../package.json' with { type: "json" };

const pluginName = 'esbuild-standalone'

const version = packageJson.version

export { version, pluginName }