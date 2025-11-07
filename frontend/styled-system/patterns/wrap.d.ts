/* eslint-disable */
import type { SystemStyleObject } from '../types/index'
import type { SystemProperties } from '../types/style-props'
import type { DistributiveOmit } from '../types/system-types'

export interface WrapProperties {
	gap?: SystemProperties['gap']
	rowGap?: SystemProperties['gap']
	columnGap?: SystemProperties['gap']
	align?: SystemProperties['alignItems']
	justify?: SystemProperties['justifyContent']
}

interface WrapStyles
	extends WrapProperties,
		DistributiveOmit<SystemStyleObject, keyof WrapProperties> {
}

interface WrapPatternFn {
	raw: (styles?: WrapStyles) => SystemStyleObject

	(styles?: WrapStyles): string
}

export declare const wrap: WrapPatternFn
