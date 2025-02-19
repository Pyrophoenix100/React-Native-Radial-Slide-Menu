import { useWindowDimensions, View } from "react-native";
import { StyleSheet } from "react-native";
import Animated, {
	useDerivedValue,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import {
	Gesture,
	GestureDetector,
	GestureHandlerRootView,
} from "react-native-gesture-handler";

export const CircleSlideNavigator = ({}) => {
	const open_size = 10;
	const inital_size = 1;
	const size = useSharedValue(inital_size);
	const open = useSharedValue(false);
	const fadeIn = useSharedValue(0);
	const { height, width } = useWindowDimensions();
	const openDrag = Gesture.Pan()
		.onUpdate((e) => {
			let change = (1 / 50) * (height - e.absoluteY);
			let open_threshold = 5;
			console.log("Y:", e.absoluteY, "Change:", change, "Open:", open.value);
			// Is open
			if (size.value >= open_threshold) {
				if (!open.value) {
					open.value = true;
				}
			}
			if (size.value < open_threshold) {
				if (open.value) {
					open.value = false;
				}
			}
			if (size.value >= inital_size) {
				size.value = change;
			}

			if (size.value > open_size) {
				size.value = open_size;
			}
		})
		.onEnd(() => {
			if (open.value) {
				size.value = withSpring(open_size);
			} else {
				size.value = withSpring(inital_size);
			}
		});
	return (
		<Animated.View style={[styles.CircleContainer, { top: 0, height: height }]}>
			<GestureDetector gesture={openDrag}>
				<Animated.View
					style={[
						styles.Circle,
						{
							position: "relative",
							height: 60,
							width: 60,
							transform: [{ scale: size }],
						},
					]}
				/>
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
		zIndex: 999,
		height: 60,
		width: 60,
		backgroundColor: "lightblue",
		alignSelf: "center",
		borderRadius: 999,
	},
});
