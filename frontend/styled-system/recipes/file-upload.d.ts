/* eslint-disable */
import type { ConditionalValue } from '../types/index'
import type { DistributiveOmit, Pretty } from '../types/system-types'

type FileUploadVariant = {}

type FileUploadVariantMap = {
	[key in keyof FileUploadVariant]: Array<FileUploadVariant[key]>
}

type FileUploadSlot =
	| 'root'
	| 'dropzone'
	| 'item'
	| 'itemDeleteTrigger'
	| 'itemGroup'
	| 'itemName'
	| 'itemPreview'
	| 'itemPreviewImage'
	| 'itemSizeText'
	| 'label'
	| 'trigger'
	| 'clearTrigger'
	| 'itemContent'
	| 'dropzoneContent'
	| 'fileText'

export type FileUploadVariantProps = {
	[key in keyof FileUploadVariant]?:
	| ConditionalValue<FileUploadVariant[key]>
	| undefined
}

export interface FileUploadRecipe {
	__slot: FileUploadSlot
	__type: FileUploadVariantProps
	raw: (props?: FileUploadVariantProps) => FileUploadVariantProps
	variantMap: FileUploadVariantMap
	variantKeys: Array<keyof FileUploadVariant>
	getVariantProps: (props?: FileUploadVariantProps) => FileUploadVariantProps

	(props?: FileUploadVariantProps): Pretty<Record<FileUploadSlot, string>>

	splitVariantProps<Props extends FileUploadVariantProps>(
		props: Props,
	): [
		FileUploadVariantProps,
		Pretty<DistributiveOmit<Props, keyof FileUploadVariantProps>>,
	]
}

export declare const fileUpload: FileUploadRecipe
