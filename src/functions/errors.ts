import { ApolloError as APError } from 'apollo-server-errors'

const ERRORS: { [key: string]: Error } = Object.entries({
	NOT_FOUND: {
		code: '404',
		message: 'Not Found',
	},
	INCORRECT_PASSWORD: {
		code: '401',
		message: 'Password is incorrect',
	},
	USER_EXISTS: {
		code: '409',
		message: 'User already exists',
	},
	INTERNAL_ERROR: {
		code: '500',
		message: 'Internal Server Error',
	},
	MALFORMED_INPUT: {
		code: '400',
		message: 'Malformed input',
	},
	UNAUTHORIZED: {
		code: '401',
		message: 'You do not have access to this resource',
	},
	INVALID_TOKEN: {
		code: '401',
		message: 'Invalid token provided',
	},
	NO_TOKEN: {
		code: '401',
		message: 'Authorization token is required',
	},
})
	.map(([key, value]) => ({ [key]: { ...value, status: 'error' } }))
	.reduce((acc, cur) => ({ ...acc, ...cur }), {})

export type Error = {
	code: string
	message: string
}

export const ApolloError = (error: Error, ...errors: string[]) =>
	new APError(error.message, error.code, { errors })

export default ERRORS
