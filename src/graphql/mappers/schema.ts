import 'graphql-import-node'
import * as authenticationTypeDefs from '../schemas/authentication.graphql'
import * as defaulTypeDefs from '../schemas/default.graphql'
import * as userTypeDefs from '../schemas/user.graphql'
import { GraphQLSchema } from 'graphql'
import { makeExecutableSchema } from '@graphql-tools/schema'
import resolvers from './resolver'

const schema: GraphQLSchema = makeExecutableSchema({
	typeDefs: [defaulTypeDefs, authenticationTypeDefs, userTypeDefs],
	resolvers,
})

export default schema
