import { createHmac } from 'crypto'

const API_SECRET = process.env.API_SECRET

if (!API_SECRET)
	throw new Error('The API_SECRET environment variable must be set')

const secretKey = API_SECRET

export default function Hash(string: string) {
	return createHmac('sha256', secretKey).update(string).digest('hex')
}
