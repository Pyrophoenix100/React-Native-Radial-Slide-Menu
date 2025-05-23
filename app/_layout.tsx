import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import {
	CircleSlideMenu,
	CircleSlideMenuOption,
} from "../components/CircleSlideMenu";
import { useColorScheme } from "@/components/useColorScheme";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export {
	// Catch any errors thrown by the Layout component.
	ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
	// Ensure that reloading on `/modal` keeps a back button present.
	initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const [loaded, error] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
		...FontAwesome.font,
	});

	// Expo Router uses Error Boundaries to catch errors in the navigation tree.
	useEffect(() => {
		if (error) throw error;
	}, [error]);

	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync();
		}
	}, [loaded]);

	if (!loaded) {
		return null;
	}

	return <RootLayoutNav />;
}
const tab_options: CircleSlideMenuOption[] = [
	{
		name: "Home",
		action: () => {
			console.log("Goin' Home!");
		},
	},
	{
		name: "My Profile",
		action: () => {
			alert("Not yet implemented!");
		},
	},
	{ name: "Settings", action: () => {} },
	{ name: "Test", action: () => {} },
	{ name: "Sandbox", action: () => {} },
	{ name: "Your Cart", action: () => {} },
	{ name: "Edit", action: () => {} },
	{ name: "Save", action: () => {} },
	{ name: "Delete", action: () => {} },
];

function RootLayoutNav() {
	const colorScheme = useColorScheme();

	return (
		<GestureHandlerRootView>
			<ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
				<Stack>
					<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
					<Stack.Screen name="modal" options={{ presentation: "modal" }} />
				</Stack>
			</ThemeProvider>
			<CircleSlideMenu
				options={tab_options}
				position={{ horizontal: "left" }}
				color="#452165"
			/>
		</GestureHandlerRootView>
	);
}
