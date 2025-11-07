/* eslint-disable */
import type { ConditionalValue, SystemStyleObject } from '../types/index'
import type { DistributiveOmit } from '../types/system-types'

export interface AspectRatioProperties {
	ratio?: ConditionalValue<number>
}

interface AspectRatioStyles
	extends AspectRatioProperties,
		DistributiveOmit<
			SystemStyleObject,
			keyof AspectRatioProperties | 'aspectRatio'
		> {
}

interface AspectRatioPatternFn {
	raw: (styles?: AspectRatioStyles) => SystemStyleObject

	(styles?: AspectRatioStyles): string
}

export declare const aspectRatio: AspectRatioPatternFn
