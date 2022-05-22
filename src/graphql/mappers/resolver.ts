import Authentication from '../resolvers/authentication'
import Merge from 'lodash/merge'
import User from '../resolvers/user'

const resolvers = Merge(Authentication, User)

export default resolvers
