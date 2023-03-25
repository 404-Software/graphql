import 'graphql-import-node'
import { makeExecutableSchema } from '@graphql-tools/schema'
import merge from 'lodash/merge'

import * as typeDefs from './schemas/schema.graphql'

import authentication from './resolvers/authentication'
import scalars from './resolvers/scalars'
import user from './resolvers/user'

const resolvers = merge(authentication, scalars, user)

export default makeExecutableSchema({ typeDefs, resolvers })
