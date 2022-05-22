require('dotenv').config()
import { ApolloServer } from 'apollo-server-express'
import { graphqlUploadExpress } from 'graphql-upload'
import ContextSetup from './context'
import express from 'express'
import schema from './graphql/mappers/schema'

async function startApolloServer() {
	const app = express()
	app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }))

	const server = new ApolloServer({
		schema,
		context: async ({ req }) => await ContextSetup(req),
	})

	await server.start()
	server.applyMiddleware({ app, path: '/' })

	const PORT = process.env.PORT || 4000

	app.listen({ port: PORT }, () => {
		// eslint-disable-next-line no-console
		console.log(`Listening on port ${PORT}`)
	})
}

startApolloServer()
