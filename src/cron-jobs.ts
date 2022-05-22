require('dotenv').config()
import { PrismaClient } from '@prisma/client'
const database = new PrismaClient()

export const expireTokens = async () => {
	const twentyFourHoursAgo = new Date(
		new Date().setHours(new Date().getHours() - 24),
	)

	await database.token.updateMany({
		where: { createdAt: { lte: twentyFourHoursAgo } },
		data: { expired: true },
	})
}
