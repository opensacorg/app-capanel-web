/* eslint-disable */
import type { SystemStyleObject } from '../types/index'
import type { SystemProperties } from '../types/style-props'
import type { DistributiveOmit } from '../types/system-types'

export interface HstackProperties {
	justify?: SystemProperties['justifyContent']
	gap?: SystemProperties['gap']
}

interface HstackStyles
	extends HstackProperties,
		DistributiveOmit<SystemStyleObject, keyof HstackProperties> {
}

interface HstackPatternFn {
	raw: (styles?: HstackStyles) => SystemStyleObject

	(styles?: HstackStyles): string
}

export declare const hstack: HstackPatternFn
