/* eslint-disable */
import type { ConditionalValue, SystemStyleObject } from '../types/index'
import type { DistributiveOmit } from '../types/system-types'
import type { Tokens } from '../tokens/index'

export interface SpacerProperties {
	size?: ConditionalValue<Tokens['spacing']>
}

interface SpacerStyles
	extends SpacerProperties,
		DistributiveOmit<SystemStyleObject, keyof SpacerProperties> {
}

interface SpacerPatternFn {
	raw: (styles?: SpacerStyles) => SystemStyleObject

	(styles?: SpacerStyles): string
}

export declare const spacer: SpacerPatternFn
