/* eslint-disable */
import type { SystemStyleObject } from '../types/index'
import type { SystemProperties } from '../types/style-props'
import type { DistributiveOmit } from '../types/system-types'

export interface FlexProperties {
	align?: SystemProperties['alignItems']
	justify?: SystemProperties['justifyContent']
	direction?: SystemProperties['flexDirection']
	wrap?: SystemProperties['flexWrap']
	basis?: SystemProperties['flexBasis']
	grow?: SystemProperties['flexGrow']
	shrink?: SystemProperties['flexShrink']
}

interface FlexStyles
	extends FlexProperties,
		DistributiveOmit<SystemStyleObject, keyof FlexProperties> {
}

interface FlexPatternFn {
	raw: (styles?: FlexStyles) => SystemStyleObject

	(styles?: FlexStyles): string
}

export declare const flex: FlexPatternFn
