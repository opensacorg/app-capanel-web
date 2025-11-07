/* eslint-disable */
import type { SystemStyleObject } from '../types/index'
import type { DistributiveOmit } from '../types/system-types'

export type BoxProperties = {}

interface BoxStyles
	extends BoxProperties,
		DistributiveOmit<SystemStyleObject, keyof BoxProperties> {
}

interface BoxPatternFn {
	raw: (styles?: BoxStyles) => SystemStyleObject

	(styles?: BoxStyles): string
}

export declare const box: BoxPatternFn
