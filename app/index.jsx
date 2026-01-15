import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import oblakLogo from "../assets/oblak.png";
import oblakLogo2 from "../assets/oblak2.png";
import { Link } from "expo-router";
import { useUser } from "../hooks/useUser";
import { Image } from "expo-image";
import * as Constants from "expo-constants";

const Home = () => {
    const { user, waiting, online, usage, localFilesCount, filesToSend, uploading, uploadProgress, uploadSpeed, uploadCount,
        checkLocalAlbums, sendMissingFiles } = useUser();

    return (
        <View style={[styles.container, { backgroundColor: online ? "#46bbf2ff" : "#005379ff" }]}>
            {online && user !== null &&
                <Text style={[styles.title, { marginBottom: 0 }]}>Ukupno: {usage >= 1024 ? (usage / 1024).toFixed(2) + " GB" : usage + " MB"}</Text>}
            
            <Image source={online ? oblakLogo : oblakLogo2} style={{ width: "60%", height: "25%" }} contentFit="contain" />
            <Text style={{ marginTop: -24, fontSize: 18 }}>v{Constants.default.expoConfig.version}</Text>
            {waiting ? <ActivityIndicator style={{ marginBottom: 20 }} size="large" color="white" /> : <View style={{ marginBottom: 56 }}/>}

            {online && user !== null && 
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.title}>Broj lokalnih datoteka: {localFilesCount} </Text>
                    {filesToSend === null && <ActivityIndicator style={{ marginBottom: 10 }} size="large" color="white" />}
                </View>}
            {online && user !== null && (filesToSend !== null ?
                (filesToSend.length === 0 ? <Text style={styles.title}>Na oblaku su sačuvane sve</Text> : (!uploading ?
                <Link href="/preview" style={{ marginBottom: 10, fontSize: 22, fontWeight: "500", textAlign: "center" }}>
                    <Text style={{ color: "#0022ffff", textDecorationLine: "underline" }}>Na oblaku nije {filesToSend.length} datoteka</Text>
                    <Text style={{ color: "#0022ffff", textDecorationLine: "underline" }}>{"\n"}(Pregled)</Text>
                </Link> :
                <View style={{ alignItems: "center" }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={styles.title}>Slanje na oblak: {Math.floor((uploadProgress.current * 100) / uploadProgress.max)}% </Text>
                        <ActivityIndicator style={{ marginBottom: 10 }} size="large" color="white" />
                    </View>
                    <Text style={styles.title}>Datoteka {uploadCount}/{filesToSend.length} ({uploadSpeed} MB/s)</Text>
                </View>)) :
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.title}>Skeniranje: </Text>
                    <ActivityIndicator style={{ marginBottom: 10 }} size="large" color="white" />
                </View>)}

            {online && user !== null && filesToSend !== null && filesToSend.length > 0 &&
                <Pressable disabled={waiting || uploading} style={({pressed}) => [styles.btn, (pressed || waiting || uploading) && styles.pressed]}
                    onPress={sendMissingFiles}>
                    <Text style={{ color: "#f2f2f2", fontSize: 22 }}>Sinhronizuj</Text>
                </Pressable>}
            {online && user !== null &&
                <Link style={[styles.btn, (waiting || uploading) && styles.pressed]} href="/settings" disabled={waiting || uploading}
                    onPress={checkLocalAlbums}>
                    <Text style={{ color: "#f2f2f2", fontSize: 22 }} >Podešavanje</Text>
                </Link>}

            {online && user === null &&
                <Link style={[styles.btn, waiting && styles.pressed]} href="/login" disabled={waiting}>
                    <Text style={{ color: "#f2f2f2", fontSize: 22 }} >Prijava</Text>
                </Link>}
            {online && user === null &&
                <Link style={[styles.btn, waiting && styles.pressed]} href="/register" disabled={waiting}>
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
    btn: {
        backgroundColor: "#0022ffff",
        padding: 15,
        borderRadius: 6,
        marginVertical: 10,
        boxShadow: "0px 4px rgba(0,0,0,0.2)"
    },
    pressed: {
        opacity: 0.6
    }
});