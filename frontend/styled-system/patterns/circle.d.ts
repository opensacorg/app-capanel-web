/* eslint-disable */
import type { SystemStyleObject } from '../types/index'
import type { SystemProperties } from '../types/style-props'
import type { DistributiveOmit } from '../types/system-types'

export interface CircleProperties {
	size?: SystemProperties['width']
}

interface CircleStyles
	extends CircleProperties,
		DistributiveOmit<SystemStyleObject, keyof CircleProperties> {
}

interface CirclePatternFn {
	raw: (styles?: CircleStyles) => SystemStyleObject

	(styles?: CircleStyles): string
}

export declare const circle: CirclePatternFn
