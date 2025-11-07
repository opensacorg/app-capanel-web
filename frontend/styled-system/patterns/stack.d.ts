/* eslint-disable */
import type { SystemStyleObject } from '../types/index'
import type { SystemProperties } from '../types/style-props'
import type { DistributiveOmit } from '../types/system-types'

export interface StackProperties {
	align?: SystemProperties['alignItems']
	justify?: SystemProperties['justifyContent']
	direction?: SystemProperties['flexDirection']
	gap?: SystemProperties['gap']
}

interface StackStyles
	extends StackProperties,
		DistributiveOmit<SystemStyleObject, keyof StackProperties> {
}

interface StackPatternFn {
	raw: (styles?: StackStyles) => SystemStyleObject

	(styles?: StackStyles): string
}

export declare const stack: StackPatternFn
