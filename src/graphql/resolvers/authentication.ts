import { Resolvers } from '../../gql-types'
import { Token } from '../../context'
import { validate as validateEmail } from 'email-validator'
import dayjs from 'dayjs'
import ERRORS, { ApolloError } from '../../functions/errors'
import Hash from '../../functions/hash'
import jwt, { verify } from 'jsonwebtoken'

const API_SECRET = process.env.API_SECRET
if (!API_SECRET)
	throw new Error('The API_SECRET environment variable must be set')

const signJWT = (payload: Token) =>
	jwt.sign(payload, API_SECRET, { expiresIn: '31d' })

const Authentication: Resolvers = {
	Query: {
		async login(_, { data: { email, password } }, { database }) {
			if (!validateEmail(email))
				throw ApolloError(
					ERRORS.MALFORMED_INPUT,
					'Please provide a valid email address',
				)

			const user = await database.user.findUnique({
				where: { email: email.toLowerCase() },
			})

			if (!user) throw ApolloError(ERRORS.NOT_FOUND)

			if (user.password !== Hash(password))
				throw ApolloError(ERRORS.INCORRECT_PASSWORD)

			return {
				user,
				token: signJWT({ id: user.id }),
			}
		},

		async checkEmail(_, { data: { email } }, { database }) {
			if (!validateEmail(email))
				throw ApolloError(
					ERRORS.MALFORMED_INPUT,
					'Please provide a valid email address',
				)

			const user = await database.user.findUnique({
				where: { email: email.toLowerCase() },
			})

			if (!user) return false

			return true
		},

		async refreshToken(_, { data: { token } }, { database }) {
			const API_SECRET = process.env.API_SECRET

			if (!API_SECRET) throw ApolloError(ERRORS.INTERNAL_ERROR)

			const { id } = verify(token.replace(/^Bearer /i, ''), API_SECRET) as Token

			const user = await database.user.findUnique({ where: { id } })

			if (!user) throw ApolloError(ERRORS.INVALID_TOKEN)

			return {
				user,
				token: signJWT({ id: user.id }),
			}
		},
	},

	Mutation: {
		async register(_, { data: { email, password, name } }, { database }) {
			if (password.length < 6)
				throw ApolloError(
					ERRORS.MALFORMED_INPUT,
					'Password must be longer than 6 characters',
				)

			if (!validateEmail(email))
				throw ApolloError(
					ERRORS.MALFORMED_INPUT,
					'Please provide a valid email address',
				)

			const user = await database.user.create({
				data: { name, email, password: Hash(password), role: 'DEFAULT' },
			})

			return {
				user,
				token: signJWT({ id: user.id }),
			}
		},

		async requestPasswordReset(_, { data: { email } }, { database }) {
			if (!validateEmail(email))
				throw ApolloError(
					ERRORS.MALFORMED_INPUT,
					'Please provide a valid email address',
				)

			const user = await database.user.findUnique({
				where: { email: email.toLowerCase() },
			})

			if (!user) return true

			const token = signJWT({ id: user.id })

			// TODO: SEND TOKEN TO USER

			await database.token.create({
				data: {
					token,
					opertation: 'RESET_PASSWORD',
				},
			})

			return true
		},

		async resetPassword(_, { data: { token, password } }, { database }) {
			const savedToken = await database.token.findUnique({
				where: { token },
			})

			const { id } = verify(token.replace(/^Bearer /i, ''), API_SECRET) as Token

			if (!id || !savedToken || savedToken.expired)
				throw ApolloError(
					ERRORS.MALFORMED_INPUT,
					'Token provided is invalid or expired',
				)

			if (dayjs().diff(dayjs(savedToken.createdAt), 'days', true) >= 1) {
				await database.token.update({
					where: { token },
					data: { expired: true },
				})

				throw ApolloError(
					ERRORS.MALFORMED_INPUT,
					'Token provided is invalid or expired',
				)
			}

			if (password.length < 6)
				throw ApolloError(
					ERRORS.MALFORMED_INPUT,
					'Password must be longer than 6 characters',
				)

			const user = await database.user.update({
				where: { id },
				data: { password: Hash(password) },
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
}

export default Authentication
