/* eslint-disable no-template-curly-in-string */
/* eslint-disable no-console */
import async from 'async'
import fs from 'fs'
import path from 'path'
import util from 'util'
import yaml from 'js-yaml'

const exec = util.promisify(require('child_process').exec)

async function zeus() {
	const isMonorepo = fs.existsSync(path.join(__dirname, '../../package.json'))
	const directory = path.join(__dirname, '../src/graphql/schemas')
	const destination = path.join(
		__dirname,
		'../src/graphql/schemas/schema.graphql',
	)
	const zeusFile = path.join(__dirname, './index.ts')
	const enumFile = path.join(
		__dirname,
		isMonorepo ? '../' : '',
		'../node_modules/graphql-zeus-core/lib/TreeToTS/templates/returnedTypes/enum.js',
	)

	fs.readFile(enumFile, 'utf8', function (err, data) {
		if (err) {
			return console.log(err)
		}
		const result = data
			.replace('export const enum ${i.name} {', 'export type ${i.name} = ')
			.replace('${f.name} = "${f.name}"', '"${f.name}"')
			.replace("(',", "('|")
			.replace('}`;', '`;')

		fs.writeFileSync(enumFile, result, 'utf8')
	})

	fs.readdir(directory, (err, files) => {
		if (err) return console.log(err)

		files = files
			.filter(file => !file.includes('schema.graphql'))
			.map(file => path.join(directory, file))

		async.map(files, fs.readFile, (err, results) => {
			if (err || !results) return console.log(err)

			fs.writeFileSync(destination, results.join('\n'))
		})
	})

	await exec('npx graphql-codegen --config codegen.yml')

	await exec('npx zeus ./src/graphql/schemas/schema.graphql ./ --apollo')

	fs.readFile(zeusFile, 'utf8', function (err, data) {
		if (err) {
			return console.log(err)
		}

		const codegen = path.join(__dirname, '../codegen.yml')

		const codegenObj = yaml.load(
			fs.readFileSync(codegen, { encoding: 'utf-8' }),
		) as {
			generates: {
				[key: string]: { config: { scalars: { [key: string]: string } } }
			}
		}

		const scalars = codegenObj.generates['./src/gql-types.ts'].config.scalars

		const replacements: Array<{ before: string; after: string }> = [
			{
				before: `["Null"]: "scalar" & { name: "Null" };`,
				after: '["Null"]: null | undefined;',
			},
			{
				before: `["Null"]:unknown;`,
				after: '["Null"]: null | undefined;',
			},
		]

		Object.keys(scalars).forEach(key => {
			replacements.push({
				before: `["${key}"]: "scalar" & { name: "${key}" };`,
				after: `["${key}"]: ${scalars[key]};`,
			})

			replacements.push({
				before: `["${key}"]:unknown;`,
				after: `["${key}"]: ${scalars[key]};`,
			})
		})

		replacements.forEach(replacement => {
			data = data.replace(replacement.before, replacement.after)
		})

		fs.writeFileSync(zeusFile, data, 'utf8')
	})
}

zeus()
