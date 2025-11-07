/* eslint-disable */
import type { ConditionalValue } from '../types/index'
import type { DistributiveOmit, Pretty } from '../types/system-types'

interface KbdVariant {
	/**
	 * @default "raised"
	 */
	variant: 'raised' | 'outline' | 'subtle' | 'plain'
	/**
	 * @default "md"
	 */
	size: 'sm' | 'md' | 'lg'
}

type KbdVariantMap = {
	[key in keyof KbdVariant]: Array<KbdVariant[key]>
}

export type KbdVariantProps = {
	[key in keyof KbdVariant]?: ConditionalValue<KbdVariant[key]> | undefined
}

export interface KbdRecipe {
	__type: KbdVariantProps
	raw: (props?: KbdVariantProps) => KbdVariantProps
	variantMap: KbdVariantMap
	variantKeys: Array<keyof KbdVariant>
	getVariantProps: (props?: KbdVariantProps) => KbdVariantProps

	(props?: KbdVariantProps): string

	splitVariantProps<Props extends KbdVariantProps>(
		props: Props,
	): [KbdVariantProps, Pretty<DistributiveOmit<Props, keyof KbdVariantProps>>]
}

export declare const kbd: KbdRecipe
