import { Tabs, TabList, TabTrigger, TabSlot } from "expo-router/ui";
import { Text } from "react-native";
import { StyleSheet } from "react-native";
// Defining the layout of the custom tab navigator
export default function Layout() {
	return (
		<Tabs>
			<TabSlot />
			<TabList>
				<TabTrigger name="home" href="/" style={styles.Tab}>
					<Text style={{ color: "white" }}>Home</Text>
				</TabTrigger>
				<TabTrigger name="two" href="/two" style={styles.Tab}>
					<Text style={{ color: "white" }}>Article</Text>
				</TabTrigger>
			</TabList>
		</Tabs>
	);
}

const styles = StyleSheet.create({
	Tab: ({ pressed }) => ({
		backgroundColor: pressed ? "#444444" : "#222222",
		padding: 10,
		alignItems: "center",
		height: 60,
		justifyContent: "center",
		flex: 1,
	}),
});
