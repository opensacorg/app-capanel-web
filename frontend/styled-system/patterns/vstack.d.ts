/* eslint-disable */
import type { SystemStyleObject } from '../types/index'
import type { SystemProperties } from '../types/style-props'
import type { DistributiveOmit } from '../types/system-types'

export interface VstackProperties {
	justify?: SystemProperties['justifyContent']
	gap?: SystemProperties['gap']
}

interface VstackStyles
	extends VstackProperties,
		DistributiveOmit<SystemStyleObject, keyof VstackProperties> {
}

interface VstackPatternFn {
	raw: (styles?: VstackStyles) => SystemStyleObject

	(styles?: VstackStyles): string
}

export declare const vstack: VstackPatternFn
