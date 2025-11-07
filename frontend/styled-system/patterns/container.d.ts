/* eslint-disable */
import type { SystemStyleObject } from '../types/index'
import type { DistributiveOmit } from '../types/system-types'

export type ContainerProperties = {}

interface ContainerStyles
	extends ContainerProperties,
		DistributiveOmit<SystemStyleObject, keyof ContainerProperties> {
}

interface ContainerPatternFn {
	raw: (styles?: ContainerStyles) => SystemStyleObject

	(styles?: ContainerStyles): string
}

export declare const container: ContainerPatternFn
