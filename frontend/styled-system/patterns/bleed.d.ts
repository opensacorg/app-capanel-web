/* eslint-disable */
import type { SystemStyleObject } from '../types/index'
import type { SystemProperties } from '../types/style-props'
import type { DistributiveOmit } from '../types/system-types'

export interface BleedProperties {
	inline?: SystemProperties['marginInline']
	block?: SystemProperties['marginBlock']
}

interface BleedStyles
	extends BleedProperties,
		DistributiveOmit<SystemStyleObject, keyof BleedProperties> {
}

interface BleedPatternFn {
	raw: (styles?: BleedStyles) => SystemStyleObject

	(styles?: BleedStyles): string
}

export declare const bleed: BleedPatternFn
