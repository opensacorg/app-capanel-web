/* eslint-disable */
import type { ConditionalValue } from '../types/index'
import type { DistributiveOmit, Pretty } from '../types/system-types'

type ToastVariant = {}

type ToastVariantMap = {
	[key in keyof ToastVariant]: Array<ToastVariant[key]>
}

type ToastSlot =
	| 'root'
	| 'title'
	| 'description'
	| 'indicator'
	| 'closeTrigger'
	| 'actionTrigger'

export type ToastVariantProps = {
	[key in keyof ToastVariant]?: ConditionalValue<ToastVariant[key]> | undefined
}

export interface ToastRecipe {
	__slot: ToastSlot
	__type: ToastVariantProps
	raw: (props?: ToastVariantProps) => ToastVariantProps
	variantMap: ToastVariantMap
	variantKeys: Array<keyof ToastVariant>
	getVariantProps: (props?: ToastVariantProps) => ToastVariantProps

	(props?: ToastVariantProps): Pretty<Record<ToastSlot, string>>

	splitVariantProps<Props extends ToastVariantProps>(
		props: Props,
	): [
		ToastVariantProps,
		Pretty<DistributiveOmit<Props, keyof ToastVariantProps>>,
	]
}

export declare const toast: ToastRecipe
