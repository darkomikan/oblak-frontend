import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useUser } from "../hooks/useUser";

const Settings = () => {
    const { user, waiting, logout, updateUser, changePassword } = useUser();

    const [password, setPassword] = useState("");
    const [camera, setCamera] = useState(user?.Camera === 1 ? true : false);
    const [viber, setViber] = useState(user?.Viber === 1 ? true : false);
    const [messenger, setMessenger] = useState(user?.Messenger === 1 ? true : false);
    const [whatsapp, setWhatsapp] = useState(user?.Whatsapp === 1 ? true : false);
    const [error, setError] = useState(null);

    const handleUpdate = async () => {
        try
        {
            setError(null);
            await updateUser(undefined, camera, viber, messenger, whatsapp);
        }
        catch (error)
        {
            setError(error.message);
        }
    };

    const handleChangePassword = async () => {
        try
        {
            setError(null);
            await changePassword(password);
        }
        catch (error)
        {
            setError(error.message);
        }
    };

    return (
        <View style={styles.container}>
            <View style={{ flexDirection: "row", alignItems: "center", width: "95%", justifyContent: "space-between" }}>
                <Pressable style={({pressed}) => [styles.btn, (pressed || waiting) && styles.pressed]} onPress={handleUpdate} disabled={waiting}>
                    <Text style={{ color: "#f2f2f2", fontSize: 22 }}>Sačuvaj</Text>
                </Pressable>
                <Text style={{ fontSize: 22, marginBottom: 10, fontWeight: "500" }}>{user?.Username}</Text>
                <Pressable style={({pressed}) => [styles.btn, { backgroundColor: "#be1900ff" }, pressed && styles.pressed]} onPress={logout}>
                    <Text style={{ color: "#f2f2f2", fontSize: 22 }}>Odjava</Text>
                </Pressable>
            </View>
            
            <Text style={{ fontSize: 22, marginBottom: 10 }}>Čuvati slike sa:</Text>
            <View style={styles.switchCard}>
                <Text style={{ paddingHorizontal: 10, fontSize: 22 }}>Kamera</Text>
                <Switch value={camera} onValueChange={setCamera} style={{ marginRight: 10 }} />
            </View>
            <View style={styles.switchCard}>
                <Text style={{ paddingHorizontal: 10, fontSize: 22 }}>Viber</Text>
                <Switch value={viber} onValueChange={setViber} style={{ marginRight: 10 }} />
            </View>
            <View style={styles.switchCard}>
                <Text style={{ paddingHorizontal: 10, fontSize: 22 }}>Messenger</Text>
                <Switch value={messenger} onValueChange={setMessenger} style={{ marginRight: 10 }} />
            </View>
            <View style={styles.switchCard}>
                <Text style={{ paddingHorizontal: 10, fontSize: 22 }}>Whatsapp</Text>
                <Switch value={whatsapp} onValueChange={setWhatsapp} style={{ marginRight: 10 }} />
            </View>

            <Text style={{ fontSize: 22, marginBottom: 10 }}>Promjena lozinke:</Text>
            <TextInput placeholder="Nova lozinka" secureTextEntry style={styles.input} value={password} onChangeText={setPassword} />
            <Pressable style={({pressed}) => [styles.btn, (pressed || waiting) && styles.pressed]} onPress={handleChangePassword} disabled={waiting}>
                <Text style={{ color: "#f2f2f2", fontSize: 22 }}>Promijeni lozinku</Text>
            </Pressable>
            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
}

export default Settings;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: 10,
        backgroundColor: "#46bbf2ff"
    },
    btn: {
        backgroundColor: "#0022ffff",
        padding: 15,
        borderRadius: 6,
        marginBottom: 10
    },
    pressed: {
        opacity: 0.6
    },
    input: {
        backgroundColor: "#d0d0d0ff",
        padding: 15,
        borderRadius: 6,
        marginBottom: 10,
        width: "80%",
        fontSize: 22
    },
    switchCard: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 6,
        marginBottom: 10,
        backgroundColor: "#d0d0d0ff"
    },
    error: {
        color: "#ff0000",
        padding: 10,
        backgroundColor: "#f5c1c8",
        borderColor: "#ff0000",
        borderWidth: 1,
        borderRadius: 6,
        marginHorizontal: 10,
        fontSize: 22
    }
});