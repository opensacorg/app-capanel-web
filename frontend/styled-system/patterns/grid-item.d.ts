/* eslint-disable */
import type { ConditionalValue, SystemStyleObject } from '../types/index'
import type { DistributiveOmit } from '../types/system-types'

export interface GridItemProperties {
	colSpan?: ConditionalValue<number>
	rowSpan?: ConditionalValue<number>
	colStart?: ConditionalValue<number>
	rowStart?: ConditionalValue<number>
	colEnd?: ConditionalValue<number>
	rowEnd?: ConditionalValue<number>
}

interface GridItemStyles
	extends GridItemProperties,
		DistributiveOmit<SystemStyleObject, keyof GridItemProperties> {
}

interface GridItemPatternFn {
	raw: (styles?: GridItemStyles) => SystemStyleObject

	(styles?: GridItemStyles): string
}

export declare const gridItem: GridItemPatternFn
