import packageJson from '../../package.json' with { type: "json" };

const version = packageJson.version

const pluginName = `${packageJson.name}@${version}`

export { version, pluginName }