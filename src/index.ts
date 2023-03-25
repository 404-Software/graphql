require('dotenv').config()
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { graphqlUploadExpress } from 'graphql-upload'
import {
	handlers,
	startServerAndCreateLambdaHandler,
} from '@as-integrations/aws-lambda'
import ContextSetup from './context'
import express from 'express'
import http from 'http'
import schema from './graphql/mappers'

const app = express()

const server = new ApolloServer({ schema })

const graphqlUpload = graphqlUploadExpress({ maxFiles: 10 })

async function startDevServer() {
	const httpServer = http.createServer(app)

	await server.start()

	app.use(graphqlUpload)
	app.use(
		'/',
		express.json(),
		expressMiddleware(server, {
			context: async ({ req }) => await ContextSetup(req),
		}),
	)

	const PORT = process.env.PORT || 4000
	await new Promise<void>(resolve => httpServer.listen({ port: PORT }, resolve))
	// eslint-disable-next-line no-console
	console.log(`🚀 Server ready on port ${PORT}`)
}

const isDevelopment = process.env.NODE_ENV === 'development'

if (isDevelopment) startDevServer()

export const serverHandler = isDevelopment
	? null
	: startServerAndCreateLambdaHandler(
			server,
			handlers.createAPIGatewayProxyEventV2RequestHandler(),
			{
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				middleware: [graphqlUpload as any],
				context: async ({ event }) => await ContextSetup(event),
			},
	  )
