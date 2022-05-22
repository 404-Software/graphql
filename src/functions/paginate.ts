import { InputMaybe, Paginate as PaginateType } from '../gql-types'

export default function Paginate(paginate?: InputMaybe<PaginateType>) {
	return {
		skip: paginate?.page ? (paginate?.page - 1) * (paginate?.perPage || 10) : 0,
		take: paginate?.perPage ? paginate?.perPage : 10,
	}
}
