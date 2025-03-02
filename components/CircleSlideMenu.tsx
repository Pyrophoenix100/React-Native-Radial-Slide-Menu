import {
	ColorValue,
	StyleSheetProperties,
	Text,
	TouchableOpacity,
	useWindowDimensions,
	View,
	ViewProps,
} from "react-native";
import { StyleSheet } from "react-native";
import Animated, {
	AnimatedProps,
	DerivedValue,
	Extrapolation,
	interpolate,
	interpolateColor,
	runOnJS,
	SharedValue,
	useDerivedValue,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import {
	Gesture,
	GestureDetector,
	PanGesture,
} from "react-native-gesture-handler";
import { useCallback, useState } from "react";
import { AnimatedComponentProps } from "react-native-reanimated/lib/typescript/createAnimatedComponent/commonTypes";

const OPTION_SIZE = 60;
const OPEN_HEIGHT = 355;
export type CircleSlideMenuOption = {
	name: string;
	action: () => void;
	style?: StyleSheet;
};

type HorizontalPosition = "center" | "left" | "right";
type VerticalPosition = "bottom" | "middle" | "top";
type Position = {
	horizontal?: HorizontalPosition;
	vertical?: VerticalPosition;
};
type Allowance = {
	locked: [start: number, end: number];
	unlocked: [start: number, end: number];
};
type DragAllowances = {
	activateY: Allowance;
	failX: Allowance;
	failY: Allowance;
};
type ReanimatedValue<T> = DerivedValue<T> | SharedValue<T>;

const x_position = ({ horizontal }: Position) => {
	const { width } = useWindowDimensions();
	switch (horizontal) {
		default:
		case "center":
			return (width - OPTION_SIZE) / 2;
		case "left":
			return 0;
		case "right":
			return width - OPTION_SIZE;
	}
};

const x_alignment = ({ horizontal }: Position) => {
	switch (horizontal) {
		default:
		case "center":
			return "center";
		case "left":
			return "flex-start";
		case "right":
			return "flex-end";
	}
};

const drag_allowances = (position: Position): DragAllowances => {
	switch (position.horizontal) {
		default:
		case "center":
			return {
				activateY: { locked: [-50, 50], unlocked: [-1, 1] },
				failX: { locked: [-40, 40], unlocked: [-100, 100] },
				failY: { locked: [-10, 999], unlocked: [-999, 999] },
			};
		case "left":
			return {
				activateY: { locked: [-150, 20], unlocked: [-1, 1] },
				failX: { locked: [-75, 10], unlocked: [-100, 100] },
				failY: { locked: [-10, 999], unlocked: [-999, 999] },
			};
		case "right":
			return {
				activateY: { locked: [-150, 20], unlocked: [-1, 1] },
				failX: { locked: [-10, 75], unlocked: [-100, 100] },
				failY: { locked: [-10, 999], unlocked: [-999, 999] },
			};
	}
};

export const CircleSlideMenu = ({
	options,
	sensitivity = 1.0,
	color = "lightblue",
	position = { horizontal: "center", vertical: "bottom" },
}: {
	options: CircleSlideMenuOption[];
	sensitivity?: number;
	color?: string;
	position?: Position;
}) => {
	const open_size = 10;
	const inital_size = 1;

	const { height } = useWindowDimensions();

	const [lockedState, setLockedState] = useState(false);
	// ======================== SHARED VALUES ===========================
	const size = useSharedValue(inital_size);
	const open = useSharedValue(false);
	const swipe = useSharedValue(0);
	const locked_open = useSharedValue(false);

	// ========================= DERIVED VALUES =========================
	const background = useDerivedValue(() => {
		return interpolateColor(
			size.value,
			[inital_size, open_size],
			["#00000000", "#FFFFFFFF"]
		);
	});
	const circle_background = useDerivedValue(() => {
		return interpolateColor(
			size.value,
			[inital_size, open_size],
			[color, "transparent"]
		);
	});
	const circle_border = useDerivedValue(() => {
		return interpolateColor(
			size.value,
			[inital_size, open_size],
			["transparent", color]
		);
	});
	const openness = useDerivedValue(() => {
		return interpolate(size.value, [inital_size, open_size], [0, 1]);
	});

	// ============================== GESTURES ==============================
	// Get drag allowances for gesture
	const allowances = drag_allowances(position);
	const openDrag = Gesture.Pan()
		.activeOffsetY(allowances.activateY[lockedState ? "locked" : "unlocked"])
		.failOffsetX(allowances.failX[lockedState ? "locked" : "unlocked"])
		.failOffsetY(allowances.failY[lockedState ? "locked" : "unlocked"])
		.onUpdate((e) => {
			let y_change = (1 / 50) * (height - e.absoluteY);
			let open_threshold = 1.5;
			if (e.velocityY < -500) {
				open.value = false;
			}
			if (size.value < open_size - open_threshold && locked_open.value) {
				open.value = false;
			}
			// Is open
			if (size.value >= open_threshold && !locked_open.value) {
				open.value = true;
			}
			if (size.value >= inital_size) {
				size.value = y_change;
			} else if (size.value < inital_size) {
				size.value = inital_size;
			}

			if (size.value > open_size) {
				size.value = open_size;
			}
		})
		.onEnd(() => {
			if (open.value) {
				runOnJS(setLockedState)(true);
				size.value = withSpring(open_size);
				locked_open.value = true;
			} else {
				runOnJS(setLockedState)(false);
				size.value = withSpring(inital_size);
				locked_open.value = false;
			}
		});

	const onSwipe = Gesture.Pan()
		.enabled(lockedState)
		.onUpdate((e) => {
			swipe.value -= (e.velocityX / 15000) * sensitivity;
			// console.log("Swiping!", swipe.value);
		})
		.onEnd((e) => {
			const nearestIncrement = (x: number, increment: number) => {
				return Math.round(x / increment) * increment;
			};
			swipe.value = withSpring(
				nearestIncrement(swipe.value, Math.PI * (2 / options.length))
			);
		});
	const onGesture = Gesture.Exclusive(openDrag, onSwipe);
	// ============================== VIEW ==============================
	return (
		<Animated.View
			style={[
				styles.CircleContainer,
				{
					alignItems: x_alignment(position),
					top: 0,
					height: height,
					backgroundColor: background,
					pointerEvents: "box-none",
				},
			]}
		>
			<ArcingOptions
				options={options}
				openness={openness}
				size={size}
				swipe={swipe}
				color={color}
				sensitivity={sensitivity}
				gestures={[openDrag, onSwipe]}
				position={position}
			/>
			<View style={{ width: OPTION_SIZE }}>
				<GestureDetector gesture={onGesture}>
					<Animated.Image
						style={[
							styles.Circle,
							{
								position: "relative",
								height: OPTION_SIZE,
								width: OPTION_SIZE,
								backgroundColor: circle_background,
								borderColor: circle_border,
								borderWidth: 1,
								transform: [{ scale: size }],
							},
						]}
					/>
				</GestureDetector>
			</View>
		</Animated.View>
	);
};

const ArcingOptions = ({
	options = [],
	size,
	openness,
	swipe,
	option_props,
	sensitivity,
	color,
	gestures: [openGesture, swipeGesture],
	position,
}: {
	options: CircleSlideMenuOption[];
	size: ReanimatedValue<number>;
	openness: ReanimatedValue<number>;
	swipe: ReanimatedValue<number>;
	option_props?: AnimatedProps<ViewProps>;
	sensitivity: number;
	color: string;
	gestures: [PanGesture, PanGesture];
	position: Position;
}) => {
	const arc = useDerivedValue(() => {
		return interpolate(
			size.value,
			[1, 10],
			[OPTION_SIZE, OPEN_HEIGHT - OPTION_SIZE]
		);
	});

	return (
		<Animated.View
			style={{
				height: arc,
				width: arc,
				position: "absolute",
				bottom: -OPTION_SIZE,
				left: 0,
				zIndex: 9999,
				pointerEvents: "box-none",
			}}
		>
			{options.map((item, index) => {
				return (
					<Option
						option={item}
						options_length={options.length}
						openness={openness}
						arc={arc}
						index={index}
						key={index}
						color={color}
						swipe={swipe}
						sensitivity={sensitivity}
						gestures={[openGesture, swipeGesture]}
						position={position}
						{...option_props}
					/>
				);
			})}
		</Animated.View>
	);
};

const Option = ({
	option,
	openness,
	options_length,
	arc,
	index,
	swipe,
	sensitivity,
	gestures: [openGesture, swipeGesture],
	position,
	color,
	...props
}: {
	option: CircleSlideMenuOption;
	openness: ReanimatedValue<number>;
	options_length: number;
	arc: ReanimatedValue<number>;
	index: number;
	swipe: ReanimatedValue<number>;
	sensitivity: number;
	gestures: [PanGesture, PanGesture];
	position: Position;
	color: string;
} & AnimatedProps<ViewProps>) => {
	const center_x = x_position(position);
	const angle = useDerivedValue(() => {
		let out =
			((Math.PI * 2) / options_length) * index +
			swipe.value +
			(Math.PI * 2) / 4; // Shift to start option 0 at top of circle
		return out;
	});
	const x = useDerivedValue(() => {
		return interpolate(
			openness.value,
			[0, 1],
			// [center_x, center_x + arc.value * Math.cos(angle.value)]
			[center_x, center_x + arc.value * Math.cos(angle.value)]
		);
	});
	const y = useDerivedValue(() => {
		let out = arc.value * Math.sin(angle.value) + OPTION_SIZE;
		return interpolate(openness.value, [0, 1], [OPTION_SIZE, out]);
	});
	const highlight = useSharedValue(0);
	const bg_color = useDerivedValue(() => {
		return interpolateColor(highlight.value, [0, 1], ["white", color]);
	});
	const onPressOption = Gesture.Tap()
		.maxDistance(20 * (1 / sensitivity))
		.onEnd((e, s) => {
			if (!s) return;
			highlight.value = withSpring(1, { duration: 0.25 }, () => {
				highlight.value = withSpring(0, { duration: 0.25 });
			});
			console.log("Option", index);
			runOnJS(option.action)();
		});

	const gesture = Gesture.Race(openGesture, swipeGesture, onPressOption);
	return (
		<Animated.View
			style={{
				height: OPTION_SIZE,
				width: OPTION_SIZE * 2,
				zIndex: 999,
				position: "absolute",
				bottom: y,
				left: x,
				opacity: openness,
			}}
		>
			<GestureDetector gesture={gesture}>
				<Animated.View
					style={{
						height: OPTION_SIZE,
						width: OPTION_SIZE * 2,
						transform: [{ translateX: -(OPTION_SIZE / 2) }],
						backgroundColor: bg_color,
						borderColor: color,
						...styles.Option,
					}}
					{...props}
				>
					<Text style={{ zIndex: 9999, fontSize: 20 }}>{option.name}</Text>
				</Animated.View>
			</GestureDetector>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	CircleContainer: {
		position: "absolute",
		justifyContent: "flex-end",
		width: "100%",
	},
	Circle: {
		zIndex: 100,
		height: OPTION_SIZE,
		width: OPTION_SIZE,
		alignSelf: "center",
		borderRadius: 999,
	},
	Option: {
		borderWidth: 2,
		zIndex: 9999,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 999,
	},
});
