import { ActivityIndicator, Dimensions, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import oblakLogo from "../assets/oblak.png";
import oblakLogo2 from "../assets/oblak2.png";
import { Link } from "expo-router";
import { useUser } from "../hooks/useUser";
import { Image } from "expo-image";

const Home = () => {
    const { user, waiting, online, usage, localFilesCount, filesToSend } = useUser();

    return (
        <View style={[styles.container, { backgroundColor: online ? "#46bbf2ff" : "#005379ff" }]}>
            {online && user !== null && <Text style={[styles.title, { marginBottom: 0 }]}>Ukupno: {usage} MB</Text>}
            <Image source={online ? oblakLogo : oblakLogo2} style={{ width: "60%", height: "25%" }} contentFit="contain" />
            {waiting ? <ActivityIndicator style={{ marginBottom: 20 }} size="large" color="white" /> : <View style={{ marginBottom: 56 }}/>}

            {online && user !== null && 
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.title}>Broj lokalnih datoteka: {localFilesCount} </Text>
                    {filesToSend === null && <ActivityIndicator style={{ marginBottom: 10 }} size="large" color="white" />}
                </View>}
            {online && user !== null && (filesToSend !== null ?
                (filesToSend.length === 0 ? <Text style={styles.title}>Na oblaku su sačuvane sve</Text> : 
                <Link href="/preview" style={{ marginBottom: 10, fontSize: 22, fontWeight: "500" }}>
                    <Text style={{ color: "#0022ffff", textDecorationLine: "underline" }}>Na oblaku nije {filesToSend.length} datoteka</Text>
                </Link>) :
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.title}>Stanje na oblaku: </Text>
                    <ActivityIndicator style={{ marginBottom: 10 }} size="large" color="white" />
                </View>)}
            {online && user !== null &&
            <Pressable disabled={waiting} style={({pressed}) => [styles.btn, (pressed || waiting) && styles.pressed]} onPress={null}>
                <Text style={{ color: "#f2f2f2", fontSize: 22 }}>Sinhronizuj</Text>
            </Pressable>}
            {online && user !== null && <Link style={[styles.btn, waiting && styles.pressed]} href="/settings" disabled={waiting}>
                <Text style={{ color: "#f2f2f2", fontSize: 22 }} >Podešavanje</Text>
            </Link>}

            {online && user === null && <Link style={[styles.btn, waiting && styles.pressed]} href="/login" disabled={waiting}>
                <Text style={{ color: "#f2f2f2", fontSize: 22 }} >Prijava</Text>
            </Link>}
            {online && user === null && <Link style={[styles.btn, waiting && styles.pressed]} href="/register" disabled={waiting}>
                <Text style={{ color: "#f2f2f2", fontSize: 22 }} >Registracija</Text>
            </Link>}
        </View>
    );
}

export default Home;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#46bbf2ff"
    },
    title: {
        fontWeight: "bold",
        fontSize: 22,
        marginBottom: 10
    },
    card: {
        backgroundColor: "#eee",
        padding: 20,
        borderRadius: 5,
        boxShadow: "4px 4px rgba(0,0,0,0.1)"
    },
    btn: {
        backgroundColor: "#0022ffff",
        padding: 15,
        borderRadius: 6,
        marginVertical: 10
    },
    pressed: {
        opacity: 0.6
    }
});