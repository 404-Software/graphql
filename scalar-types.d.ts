import { ReadStream } from 'fs'

export type File = {
	createReadStream: () => ReadStream
	filename: string
	mimetype: string
}
