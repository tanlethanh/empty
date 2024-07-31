/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
import type { FC, ReactNode } from 'react';
import type { LayoutRectangle } from 'react-native';
import { proxy } from 'valtio';

/**
 * XY alignment, X is x-axis (horizontal) layout measurement, Y is y-axis (vertical) layout measurement
 */
export enum Align {
	/**
	 * ModalNode will be placed in center of both x-axis and y-axis.
	 * Layout calculation bases on center of Rectangle layout of Component,
	 * so you need to setup height width of component by yourself.
	 *
	 * I prefer using this one when I need center something and the content has its size
	 */
	CenterCenter = 'CenterCenter',
	/**
	 * Full align make ModalNode shrink to full an axis,
	 * but the measurement happen after first render to get layout rectangle,
	 * so we need to use offset to create initial position to make Component
	 * full without waiting for layout
	 */
	FullCenter = 'FullCenter',
	FullBottom = 'FullBottom',
}

export type GeneralModalConfig = ModalConfig | ModalWithComponentConfig<any>;

export type ModalConfig = {
	id: string;
	showBackdrop?: boolean;
	/** default True */
	closeOnPressBackdrop?: boolean;
	onPressBackdrop?: () => void;
	/**
	 * Align is predefined layout alignment,
	 * if not using this alignment, the ModalNode will be
	 * placed under your App children inside ModalProvider,
	 * so you might need to make it 'absolute' position and place it by yourself
	 */
	align?: Align;
	/**
	 * apply horizontal offset like horizontal padding, only used with `X == Full`
	 */
	xOffset?: number;
	/**
	 * apply vertical offset like vertical padding, only used with `Y == Full`
	 */
	yOffset?: number;

	/** Place a float Component inside Modal Container, positioning by yourself*/
	FloatComponent?: FC<any>;
};

const defaultConfig = {
	closeOnPressBackdrop: true,
};

export const modalNodeMap: Record<string, ReactNode> = {};
export const modalComponentMap: Record<string, FC<any>> = {};
export const modalConfigMap = proxy<Record<string, GeneralModalConfig>>({});

export const cleanModal = (id: string) => {
	delete modalNodeMap[id];
	delete modalComponentMap[id];
	delete modalConfigMap[id];
};

/**
 * The initial props of the passed ReactNode will not updated as the state updating.
 * So you might not want to manage state outside of this ReactNode
 */
export const showModal = (node: ReactNode, config: ModalConfig) => {
	delete modalNodeMap[config.id];
	delete modalConfigMap[config.id];
	modalNodeMap[config.id] = node;
	modalConfigMap[config.id] = { ...defaultConfig, ...config };

	return {
		cleanModal: () => {
			cleanModal(config.id);
		},
	};
};

export type ModalWithComponentConfig<Props> = {
	/**
	 * Must add this props object to correctly render Component, distinguish with ReactNode
	 */
	props: Props;
} & ModalConfig;

/**
 * The initial props of the passed ReactNode will not updated as the state updating.
 * So you might not want to manage state outside of this ReactNode
 */
export const showModalWithComponent = <T,>(
	component: FC<T>,
	config: ModalWithComponentConfig<T>,
) => {
	delete modalComponentMap[config.id];
	delete modalConfigMap[config.id];
	modalComponentMap[config.id] = component;
	modalConfigMap[config.id] = { ...defaultConfig, ...config };

	return {
		cleanModal: () => {
			cleanModal(config.id);
		},
	};
};

export type Position = {
	top?: number;
	bottom?: number;
	left?: number;
	right?: number;
	opacity?: number;
};

export type CalculateOptions = {
	parent?: LayoutRectangle;
	child?: LayoutRectangle;
	config: ModalConfig;
};

export const calculatePosition = ({
	parent,
	child,
	config: { align, xOffset = 0 },
}: CalculateOptions): Position | null => {
	if (align === Align.CenterCenter) {
		if (!parent || !child) return null;
		return {
			top: (parent.height - child.height) / 2,
			bottom: (parent.height - child.height) / 2,
			left: (parent.width - child.width) / 2,
			right: (parent.width - child.width) / 2,
		};
	} else if (align === Align.FullCenter) {
		if (!parent || !child)
			/**
			 * This initial position make element width persistent,
			 * opacity is used to hide element for persistent animation
			 */
			return {
				left: xOffset,
				right: xOffset,
				opacity: 0,
			};
		return {
			top: (parent.height - child.height) / 2,
			bottom: (parent.height - child.height) / 2,
			left: xOffset,
			right: xOffset,
		};
	} else if (align === Align.FullBottom) {
		return {
			bottom: 0,
			left: xOffset,
			right: xOffset,
		};
	} else {
		throw Error(`not supported alignment: ${align}`);
	}
};
