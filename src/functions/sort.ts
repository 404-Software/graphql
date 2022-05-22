import { InputMaybe, Sort as SortType } from '../gql-types'

export default function Sort(sort?: InputMaybe<SortType>) {
	return {
		[sort?.sortField || 'createdAt']: sort?.sortOrder?.toLowerCase() || 'desc',
	}
}
