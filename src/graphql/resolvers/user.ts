import { Resolvers } from '../../gql-types'

export default {
	Query: {
		async myUser(_, __, { database, requireAuth, user }) {
			requireAuth()

			return await database.user.findUnique({ where: { id: user?.id } })
		},

		async user(_, input, { database, requireAuth, isAdmin }) {
			requireAuth(isAdmin)

			return await database.user.findUnique(input)
		},

		async users(_, input, { database, requireAuth, isAdmin }) {
			requireAuth(isAdmin)

			return await database.user.findMany(input)
		},

		async usersCount(_, input, { database, requireAuth, isAdmin }) {
			requireAuth(isAdmin)

			return await database.user.count(input)
		},
	},

	Mutation: {
		async createUser(_, { data }, { database, requireAuth, isAdmin }) {
			requireAuth(isAdmin)

			return await database.user.create({ data })
		},

		async updateMyUser(_, input, { database, requireAuth, user }) {
			requireAuth()

			return await database.user.update({
				where: { id: user?.id },
				...input,
			})
		},

		async updateUser(_, { data, where }, { database, requireAuth, isAdmin }) {
			requireAuth(isAdmin)

			return await database.user.update({ where, data })
		},

		async deleteUser(_, input, { database, requireAuth, isAdmin }) {
			requireAuth(isAdmin)

			return await database.user.delete(input)
		},
	},
} as Resolvers
