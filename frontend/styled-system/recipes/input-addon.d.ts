/* eslint-disable */
import type { ConditionalValue } from '../types/index'
import type { DistributiveOmit, Pretty } from '../types/system-types'

interface InputAddonVariant {
	/**
	 * @default "md"
	 */
	size: '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
	/**
	 * @default "outline"
	 */
	variant: 'outline' | 'subtle' | 'flushed'
}

type InputAddonVariantMap = {
	[key in keyof InputAddonVariant]: Array<InputAddonVariant[key]>
}

export type InputAddonVariantProps = {
	[key in keyof InputAddonVariant]?:
	| ConditionalValue<InputAddonVariant[key]>
	| undefined
}

export interface InputAddonRecipe {
	__type: InputAddonVariantProps
	raw: (props?: InputAddonVariantProps) => InputAddonVariantProps
	variantMap: InputAddonVariantMap
	variantKeys: Array<keyof InputAddonVariant>
	getVariantProps: (props?: InputAddonVariantProps) => InputAddonVariantProps

	(props?: InputAddonVariantProps): string

	splitVariantProps<Props extends InputAddonVariantProps>(
		props: Props,
	): [
		InputAddonVariantProps,
		Pretty<DistributiveOmit<Props, keyof InputAddonVariantProps>>,
	]
}

export declare const inputAddon: InputAddonRecipe
