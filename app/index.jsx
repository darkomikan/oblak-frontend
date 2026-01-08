import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import oblakLogo from "../assets/oblak.png"
import oblakLogo2 from "../assets/oblak2.png"
import { Link } from "expo-router";
import { useUser } from "../hooks/useUser";
import * as MediaLibrary from 'expo-media-library';

const Home = () => {
    // const [albums, setAlbums] = useState(null);
    // const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

    const { user, waiting, online, usage, checkStatus } = useUser();

    const checkAlbums = async () => {
        // if (permissionResponse.status !== "granted")
        // {
        //     await requestPermission();
        //     if (permissionResponse.status !== "granted")
        //         return;
        // }
        // const fetchedAlbums = await MediaLibrary.getAlbumsAsync({
        //     includeSmartAlbums: true,
        // });
        // fetchedAlbums.forEach((val, index) => {
        //     console.log(val.title + val.id + val.assetCount);
        // });
        // setAlbums(fetchedAlbums);
    };

    return (
        <View style={[styles.container, { backgroundColor: online ? "#46bbf2ff" : "#005379ff" }]}>
            {online && user !== null && <Text style={[styles.title, { marginBottom: 0 }]}>Ukupno: {usage} MB</Text>}
            <Image source={online ? oblakLogo : oblakLogo2} style={{ width: "60%", height: "25%", resizeMode: "center" }} />
            {
                waiting ? <ActivityIndicator style={{ marginBottom: 20 }} size="large" color="white" /> : 
                (online ? <View style={{ marginBottom: 56 }}/> :
                <Pressable style={({pressed}) => [styles.btn, pressed && styles.pressed]} onPress={checkStatus}>
                    <Text style={{ color: "#f2f2f2", fontSize: 22 }}>Poveži se</Text>
                </Pressable>)
            }

            {online && user !== null && user.Camera === 1 && <Text style={styles.title}>Kamera</Text>}
            {online && user !== null && user.Viber === 1 && <Text style={styles.title}>Viber</Text>}
            {online && user !== null && user.Messenger === 1 && <Text style={styles.title}>Messenger</Text>}
            {online && user !== null && user.Whatsapp === 1 && <Text style={styles.title}>Whatsapp</Text>}
            {online && user !== null &&
            <Pressable disabled={waiting} style={({pressed}) => [styles.btn, (pressed || waiting) && styles.pressed]} onPress={checkStatus}>
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
        marginBottom: 10
    },
    pressed: {
        opacity: 0.6
    }
});