/* eslint-disable */
import type { SystemStyleObject } from '../types/index'
import type { DistributiveOmit } from '../types/system-types'

export type VisuallyHiddenProperties = {}

interface VisuallyHiddenStyles
	extends VisuallyHiddenProperties,
		DistributiveOmit<SystemStyleObject, keyof VisuallyHiddenProperties> {
}

interface VisuallyHiddenPatternFn {
	raw: (styles?: VisuallyHiddenStyles) => SystemStyleObject

	(styles?: VisuallyHiddenStyles): string
}

export declare const visuallyHidden: VisuallyHiddenPatternFn
