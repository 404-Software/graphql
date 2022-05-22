import { PrismaClient } from '@prisma/client'
import { User } from './gql-types'
import { verify } from 'jsonwebtoken'
import ERRORS, { ApolloError } from './functions/errors'

export const database = new PrismaClient()

export type Context = {
	database: PrismaClient
	user?: Pick<User, 'id' | 'role'>
	isAdmin: boolean
	// eslint-disable-next-line no-unused-vars
	requireAuth: (statement?: boolean) => void
	ip: string
}

type Request = {
	headers: {
		Authorization?: string
		authorization?: string
	}
	requestContext?: {
		identity?: {
			sourceIp?: string
		}
	}
	socket?: {
		remoteAddress?: string
	}
}

export type Token = {
	id: string
}

export default async function ContextSetup({
	headers,
	requestContext,
	socket,
}: Request) {
	const API_SECRET = process.env.API_SECRET

	if (!API_SECRET)
		throw new Error('The API_SECRET environment variable must be set')

	const token = headers.Authorization || headers.authorization

	if (token) {
		const { id } = verify(
			token.replace(/^Bearer /i, ''),
			API_SECRET,
			(err, decoded) => {
				if (err) {
					throw ApolloError(ERRORS.INVALID_TOKEN)
				}

				return decoded
			},
		) as unknown as Token

		const user = await database.user.findUnique({ where: { id } })

		if (!user) throw ApolloError(ERRORS.INVALID_TOKEN)

		return {
			database,
			user: { id: user.id, role: user.role },
			isAdmin: user.role === 'ADMIN',
			requireAuth(statement?: boolean) {
				if (statement === false) throw ApolloError(ERRORS.UNAUTHORIZED)
			},
			ip: requestContext?.identity?.sourceIp || socket?.remoteAddress,
		}
	}

	return {
		database,
		isAdmin: false,
		requireAuth() {
			throw ApolloError(ERRORS.NO_TOKEN)
		},
		ip: requestContext?.identity?.sourceIp || socket?.remoteAddress,
	}
}
