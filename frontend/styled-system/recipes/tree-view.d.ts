/* eslint-disable */
import type { ConditionalValue } from '../types/index'
import type { DistributiveOmit, Pretty } from '../types/system-types'

interface TreeViewVariant {
	/**
	 * @default "md"
	 */
	size: 'md' | 'sm' | 'xs'
	/**
	 * @default "subtle"
	 */
	variant: 'subtle' | 'solid'
	animateContent: boolean
}

type TreeViewVariantMap = {
	[key in keyof TreeViewVariant]: Array<TreeViewVariant[key]>
}

type TreeViewSlot =
	| 'branch'
	| 'branchContent'
	| 'branchControl'
	| 'branchIndentGuide'
	| 'branchIndicator'
	| 'branchText'
	| 'branchTrigger'
	| 'item'
	| 'itemIndicator'
	| 'itemText'
	| 'label'
	| 'nodeCheckbox'
	| 'root'
	| 'tree'

export type TreeViewVariantProps = {
	[key in keyof TreeViewVariant]?:
	| ConditionalValue<TreeViewVariant[key]>
	| undefined
}

export interface TreeViewRecipe {
	__slot: TreeViewSlot
	__type: TreeViewVariantProps
	raw: (props?: TreeViewVariantProps) => TreeViewVariantProps
	variantMap: TreeViewVariantMap
	variantKeys: Array<keyof TreeViewVariant>
	getVariantProps: (props?: TreeViewVariantProps) => TreeViewVariantProps

	(props?: TreeViewVariantProps): Pretty<Record<TreeViewSlot, string>>

	splitVariantProps<Props extends TreeViewVariantProps>(
		props: Props,
	): [
		TreeViewVariantProps,
		Pretty<DistributiveOmit<Props, keyof TreeViewVariantProps>>,
	]
}

export declare const treeView: TreeViewRecipe
