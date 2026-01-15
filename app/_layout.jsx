import { Stack } from "expo-router";
import { UserProvider } from "../contexts/UserContext";

const RootLayout = () => {
    return (
        <UserProvider>
            <Stack screenOptions={{ headerStyle: { backgroundColor: "#d0d0d0ff"}, headerTintColor: "#333" }}>
                <Stack.Screen name="index" options={{ headerShown: false }}/>
                <Stack.Screen name="register" options={{ title: "Registruj novi nalog" }}/>
                <Stack.Screen name="login" options={{ title: "Prijavi se na svoj nalog" }}/>
                <Stack.Screen name="settings" options={{ title: "Podešavanje naloga" }}/>
                <Stack.Screen name="preview" options={{ title: "Pregled novih datoteka" }}/>
            </Stack>
        </UserProvider>
    );
}

export default RootLayout;