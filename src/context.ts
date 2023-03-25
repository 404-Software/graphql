import { ApolloError } from './functions/errors'
import { PrismaClient } from '@prisma/client'
import { User } from './gql-types'
import { verify } from 'jsonwebtoken'

export const database = new PrismaClient()

export type Context = {
	database: PrismaClient
	user?: Pick<User, 'id' | 'role'>
	isAdmin: boolean
	requireAuth: (authorization?: boolean) => void
	ip: string
}

type Request = {
	headers: {
		Authorization?: string
		authorization?: string
		'User-Agent'?: string
		'user-agent'?: string
	}
	requestContext?: { http?: { sourceIp?: string } }
	socket?: { remoteAddress?: string }
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

	const config = await database.config.findFirst()

	const token = headers.Authorization || headers.authorization
	const ip =
		requestContext?.http?.sourceIp || socket?.remoteAddress || 'unknown'
	const userAgent = headers['User-Agent'] || headers['user-agent']

	if (!token) {
		if (config?.maintenanceMode) throw ApolloError('MAINTENANCE_ACTIVE')

		return {
			database,
			isAdmin: false,
			requireAuth() {
				throw ApolloError('NO_TOKEN')
			},
			ip,
			userAgent,
		}
	}

	const trimmedToken = token.replace('Bearer ', '')

	const { id } = verify(trimmedToken, API_SECRET, (err, decoded) => {
		if (err) throw ApolloError('INVALID_TOKEN')

		return decoded
	}) as unknown as { id: string }

	const user = await database.user.findUniqueOrThrow({
		where: { id },
		select: { id: true, role: true },
	})

	if (config?.maintenanceMode && user.role !== 'ADMIN')
		throw ApolloError('MAINTENANCE_ACTIVE')

	return {
		database,
		user,
		isAdmin: user.role === 'ADMIN',
		requireAuth(authorization = true) {
			if (!authorization) throw ApolloError('UNAUTHORIZED')
		},
		ip,
		userAgent,
	}
}
