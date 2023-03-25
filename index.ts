import {
	$,
	GraphQLTypes,
	InputType,
	OperationOptions,
	ScalarDefinition,
	ValueTypes,
	Zeus,
} from './zeus'
import {
	ApolloCache,
	DefaultContext,
	gql,
	MutationFunctionOptions,
	MutationHookOptions,
	MutationResult,
	OperationVariables,
	useMutation,
} from '@apollo/client'
import { useTypedLazyQuery, useTypedQuery } from './zeus/apollo'

function useTypedMutation<
	Z extends ValueTypes[O],
	O extends 'Mutation',
	SCLR extends ScalarDefinition,
	T extends keyof ValueTypes[O],
>(
	mutation: T,
	params: ValueTypes[O][T],
	options?: {
		apolloOptions?: MutationHookOptions<InputType<GraphQLTypes[O], Z, SCLR>>
		operationOptions?: OperationOptions
		scalars?: SCLR
	},
): [
	(
		data?:
			| MutationFunctionOptions<
					InputType<GraphQLTypes[O], Z, SCLR>,
					OperationVariables,
					DefaultContext,
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					ApolloCache<any>
			  >
			| {
					variables?: ValueTypes[O][T] extends Array<infer U>
						? U
						: ValueTypes[O][T]
			  },
	) => void,
	MutationResult<InputType<GraphQLTypes[O], Z, SCLR>>,
] {
	const [mutate, result] = useMutation<InputType<GraphQLTypes[O], Z, SCLR>>(
		gql(
			Zeus(
				'mutation',
				{ [mutation]: params },
				{
					operationOptions: options?.operationOptions,
					scalars: options?.scalars,
				},
			),
		),
		options?.apolloOptions,
	)

	return [
		data =>
			mutate({
				...data,
				variables: data?.variables as OperationOptions,
			}),
		result,
	]
}

export { $, useTypedLazyQuery, useTypedQuery, useTypedMutation }
export type { GraphQLTypes }
