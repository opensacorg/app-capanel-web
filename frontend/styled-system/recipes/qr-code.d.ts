/* eslint-disable */
import type { ConditionalValue } from '../types/index'
import type { DistributiveOmit, Pretty } from '../types/system-types'

interface QrCodeVariant {
	/**
	 * @default "md"
	 */
	size: '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

type QrCodeVariantMap = {
	[key in keyof QrCodeVariant]: Array<QrCodeVariant[key]>
}

type QrCodeSlot = 'root' | 'frame' | 'pattern' | 'overlay' | 'downloadTrigger'

export type QrCodeVariantProps = {
	[key in keyof QrCodeVariant]?:
	| ConditionalValue<QrCodeVariant[key]>
	| undefined
}

export interface QrCodeRecipe {
	__slot: QrCodeSlot
	__type: QrCodeVariantProps
	raw: (props?: QrCodeVariantProps) => QrCodeVariantProps
	variantMap: QrCodeVariantMap
	variantKeys: Array<keyof QrCodeVariant>
	getVariantProps: (props?: QrCodeVariantProps) => QrCodeVariantProps

	(props?: QrCodeVariantProps): Pretty<Record<QrCodeSlot, string>>

	splitVariantProps<Props extends QrCodeVariantProps>(
		props: Props,
	): [
		QrCodeVariantProps,
		Pretty<DistributiveOmit<Props, keyof QrCodeVariantProps>>,
	]
}

export declare const qrCode: QrCodeRecipe
