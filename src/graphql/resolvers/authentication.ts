import { ApolloError } from '../../functions/errors'
import { Resolvers } from '../../gql-types'
import { Token } from '../../context'
import dayjs from 'dayjs'
import jwt, { verify } from 'jsonwebtoken'

const API_SECRET = process.env.API_SECRET
if (!API_SECRET)
	throw new Error('The API_SECRET environment variable must be set')

const signJWT = (payload: Token) =>
	jwt.sign(payload, API_SECRET, { expiresIn: '31d' })

export default {
	Query: {
		async login(_, { data: { email, password } }, { database }) {
			const user = await database.user.findUnique({
				where: { email: email.toLowerCase() },
			})

			if (!user) throw ApolloError('NOT_FOUND')

			if (user.password !== password) throw ApolloError('INCORRECT_PASSWORD')

			return {
				user,
				token: signJWT({ id: user.id }),
			}
		},

		async checkEmail(_, { data: { email } }, { database }) {
			const user = await database.user.findUnique({
				where: { email: email.toLowerCase() },
			})

			if (!user) return false

			return true
		},

		async refreshToken(_, __, { database, user: loggedInUser }) {
			const user = await database.user.findUniqueOrThrow({
				where: { id: loggedInUser?.id },
			})

			return {
				user,
				token: signJWT({ id: user.id }),
			}
		},
	},

	Mutation: {
		async register(_, { data }, { database }) {
			const user = await database.user.create({ data })

			return {
				user,
				token: signJWT({ id: user.id }),
			}
		},

		async requestPasswordReset(_, { data: { email } }, { database }) {
			const user = await database.user.findUnique({
				where: { email: email.toLowerCase() },
			})

			if (!user) return true

			const token = signJWT({ id: user.id })

			// TODO: SEND TOKEN TO USER

			await database.token.create({
				data: {
					token,
					operation: 'RESET_PASSWORD',
				},
			})

			return true
		},

		async resetPassword(_, { data: { token, password } }, { database }) {
			// TODO: REFACTOR THIS

			const savedToken = await database.token.findUnique({
				where: { token },
			})

			const { id } = verify(token.replace(/^Bearer /i, ''), API_SECRET) as Token

			if (!id || !savedToken || savedToken.expired)
				throw ApolloError(
					'MALFORMED_INPUT',
					'Token provided is invalid or expired',
				)

			if (dayjs().diff(dayjs(savedToken.createdAt), 'days', true) >= 1) {
				await database.token.update({
					where: { token },
					data: { expired: true },
				})

				throw ApolloError(
					'MALFORMED_INPUT',
					'Token provided is invalid or expired',
				)
			}

			if (password.length < 6)
				throw ApolloError(
					'MALFORMED_INPUT',
					'Password must be longer than 6 characters',
				)

			const user = await database.user.update({
				where: { id },
				data: { password },
			})

			await database.token.update({
				where: { token },
				data: { expired: true },
			})

			return {
				user,
				token: signJWT({ id }),
			}
		},
	},
} as Resolvers
