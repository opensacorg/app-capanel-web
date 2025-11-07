/* eslint-disable */
import type { SystemStyleObject } from '../types/index'
import type { SystemProperties } from '../types/style-props'
import type { DistributiveOmit } from '../types/system-types'

export interface SquareProperties {
	size?: SystemProperties['width']
}

interface SquareStyles
	extends SquareProperties,
		DistributiveOmit<SystemStyleObject, keyof SquareProperties> {
}

interface SquarePatternFn {
	raw: (styles?: SquareStyles) => SystemStyleObject

	(styles?: SquareStyles): string
}

export declare const square: SquarePatternFn
