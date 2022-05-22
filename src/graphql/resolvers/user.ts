import { Prisma } from '@prisma/client'
import { Resolvers } from '../../gql-types'
import Hash from '../../functions/hash'
import Paginate from '../../functions/paginate'
import Sort from '../../functions/sort'

const User: Resolvers = {
	Query: {
		async Me(_, __, { database, requireAuth, user }) {
			requireAuth()

			return await database.user.findUnique({ where: { id: user?.id } })
		},

		async User(_, { id }, { database, requireAuth, isAdmin }) {
			requireAuth(isAdmin)

			return await database.user.findUnique({ where: { id } })
		},

		async allUsers(
			_,
			{ paginate, sort, filter },
			{ database, requireAuth, isAdmin },
		) {
			requireAuth(isAdmin)

			const where: Prisma.UserWhereInput = {}
			if (filter) {
				if (filter.name) {
					where.name = {
						contains: filter.name,
						mode: 'insensitive',
					}
				}
			}

			const { skip, take } = Paginate(paginate)

			return await database.user.findMany({
				where,
				skip,
				take,
				orderBy: Sort(sort),
			})
		},

		async _allUsersCount(_, { filter }, { database, requireAuth, isAdmin }) {
			requireAuth(isAdmin)

			const where: Prisma.UserWhereInput = {}

			if (filter) {
				if (filter.name) {
					where.name = {
						contains: filter.name,
						mode: 'insensitive',
					}
				}
			}

			return await database.user.count({ where })
		},
	},
	Mutation: {
		async createUser(
			_,
			{ role, password, ...rest },
			{ database, requireAuth, isAdmin },
		) {
			requireAuth(isAdmin)

			const data: Prisma.UserCreateInput = {
				...rest,
				password: Hash(password),
			}
			if (role) data.role = role

			return await database.user.create({ data })
		},

		async updateUser(
			_,
			{ id, name, email, password, role },
			{ database, requireAuth, isAdmin },
		) {
			requireAuth(isAdmin)

			const data: Prisma.UserUpdateInput = {}
			if (name) data.name = name
			if (email) data.email = email
			if (password) data.password = Hash(password)
			if (role) data.role = role

			return await database.user.update({ where: { id }, data })
		},

		async updateMe(_, { name, email }, { database, requireAuth, user }) {
			requireAuth()

			const data: Prisma.UserUpdateInput = {}
			if (name) data.name = name
			if (email) data.email = email

			return await database.user.update({ where: { id: user?.id }, data })
		},

		async deleteUser(_, { id }, { database, requireAuth, isAdmin }) {
			requireAuth(isAdmin)

			return await database.user.delete({ where: { id } })
		},
	},
}

export default User
