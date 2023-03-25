import { ApolloError } from '../../functions/errors'
import { GraphQLScalarType } from 'graphql'
import { GraphQLUpload } from 'graphql-upload'
import { Resolvers } from '../../gql-types'
import { validate as validateEmail } from 'email-validator'
import dayjs from 'dayjs'
import Hash from '../../functions/hash'
import parsePhoneNumber, { isValidPhoneNumber } from 'libphonenumber-js/min'

const UntrimmedString = new GraphQLScalarType({
	name: 'UntrimmedString',
	description: 'Untrimmed String',
	parseValue(value) {
		if (typeof value !== 'string')
			throw ApolloError('MALFORMED_INPUT', 'Please provide a valid string')

		return value
	},
})

const String = new GraphQLScalarType({
	name: 'String',
	description: 'Trimmed string',
	parseValue(value) {
		if (typeof value !== 'string')
			throw ApolloError('MALFORMED_INPUT', 'Please provide a valid string')

		return value.trim()
	},
})

const LowercaseString = new GraphQLScalarType({
	name: 'LowercaseString',
	description: 'Lowercase trimmed string',
	parseValue(value) {
		if (typeof value !== 'string')
			throw ApolloError('MALFORMED_INPUT', 'Please provide a valid string')

		return value.toLowerCase().trim()
	},
})

const UppercaseString = new GraphQLScalarType({
	name: 'UppercaseString',
	description: 'Uppercase trimmed string',
	parseValue(value) {
		if (typeof value !== 'string')
			throw ApolloError('MALFORMED_INPUT', 'Please provide a valid string')

		return value.toUpperCase().trim()
	},
})

const EmailAddress = new GraphQLScalarType({
	name: 'EmailAddress',
	description: 'Email Address validated string',
	parseValue(value) {
		if (typeof value !== 'string')
			throw ApolloError('MALFORMED_INPUT', 'Please provide a valid string')

		const email = value.toLowerCase().trim()

		if (!validateEmail(email))
			throw ApolloError(
				'MALFORMED_INPUT',
				'Please provide a valid email address',
			)

		return email
	},
})

const OTP = new GraphQLScalarType({
	name: 'OTP',
	description: 'OTP validated string',
	parseValue(value) {
		if (typeof value !== 'string')
			throw ApolloError('MALFORMED_INPUT', 'Please provide a valid string')

		if (value.length !== 4) throw ApolloError('INVALID_OTP')

		return value
	},
})

const Password = new GraphQLScalarType({
	name: 'Password',
	description: 'Password validated string',
	parseValue(value) {
		if (typeof value !== 'string')
			throw ApolloError('MALFORMED_INPUT', 'Please provide a valid string')

		if (value.length < 6)
			throw ApolloError(
				'MALFORMED_INPUT',
				'Password must be longer than 6 characters',
			)

		return Hash(value)
	},
})

const PhoneNumber = new GraphQLScalarType({
	name: 'PhoneNumber',
	description: 'Phone Number validated string',
	parseValue(value) {
		if (typeof value !== 'string')
			throw ApolloError('MALFORMED_INPUT', 'Please provide a valid string')

		if (!isValidPhoneNumber(value))
			throw ApolloError(
				'MALFORMED_INPUT',
				'Please provide a valid phone number',
			)

		return parsePhoneNumber(value)!.number
	},
})

const _Date = new GraphQLScalarType({
	name: 'Date',
	description: 'Parsed Date',
	parseValue(value) {
		if (typeof value !== 'string')
			throw ApolloError('MALFORMED_INPUT', 'Please provide a valid string')

		const dateParts = value.split('/')

		const dateObject = new Date(+dateParts[2], +dateParts[1] - 1, +dateParts[0])

		return dayjs(dateObject).add(3, 'hours').toDate()
	},
})

export default {
	UntrimmedString,
	String,
	LowercaseString,
	UppercaseString,
	EmailAddress,
	Password,
	OTP,
	PhoneNumber,
	Date: _Date,
	File: GraphQLUpload,
} as Resolvers
