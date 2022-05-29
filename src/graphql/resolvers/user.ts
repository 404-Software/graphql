import { Prisma } from '@prisma/client'
import { Resolvers } from '../../gql-types'
import ERRORS, { ApolloError } from '../../functions/errors'
import Hash from '../../functions/hash'

const User: Resolvers = {
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
		async createUser(
			_,
			{ data: { password, ...rest } },
			{ database, requireAuth, isAdmin },
		) {
			requireAuth(isAdmin)

			if (password.length < 6)
				throw ApolloError(
					ERRORS.MALFORMED_INPUT,
					'Password must be longer than 6 characters',
				)

			const data: Prisma.UserCreateInput = {
				password: Hash(password),
				...rest,
			}

			return await database.user.create({ data })
		},

		async updateMyUser(_, input, { database, requireAuth, user }) {
			requireAuth()

			return await database.user.update({
				where: { id: user?.id },
				...input,
			})
		},

		async updateUser(
			_,
			{ data: { password, ...rest }, where },
			{ database, requireAuth, isAdmin },
		) {
			requireAuth(isAdmin)

			const data: Prisma.UserUpdateInput = { ...rest }
			if (password) {
				if (password.length < 6)
					throw ApolloError(
						ERRORS.MALFORMED_INPUT,
						'Password must be longer than 6 characters',
					)

				data.password = Hash(password)
			}

			return await database.user.update({ where, data })
		},

		async deleteUser(_, input, { database, requireAuth, isAdmin }) {
			requireAuth(isAdmin)

			return await database.user.delete(input)
		},
	},
}

export default User
