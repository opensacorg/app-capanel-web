/* eslint-disable */
import type { SystemStyleObject } from '../types/index'
import type { DistributiveOmit } from '../types/system-types'

export type LinkOverlayProperties = {}

interface LinkOverlayStyles
	extends LinkOverlayProperties,
		DistributiveOmit<SystemStyleObject, keyof LinkOverlayProperties> {
}

interface LinkOverlayPatternFn {
	raw: (styles?: LinkOverlayStyles) => SystemStyleObject

	(styles?: LinkOverlayStyles): string
}

export declare const linkOverlay: LinkOverlayPatternFn
