import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useUser } from "../hooks/useUser";

const Register = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);

    const { waiting, register } = useUser();

    const handleSubmit = async () => {
        try
        {
            setError(null);
            await register(username, password);
        }
        catch (error)
        {
            setError(error.message);
        }
    };

    return (
        <View style={styles.container}>
            <Link href="/login" style={{ marginBottom: 10, fontSize: 22, fontWeight: "500" }}>
                <Text style={{ color: "#0022ffff", textDecorationLine: "underline" }}>Već imaš nalog? Prijavi se</Text>
            </Link>
            <TextInput placeholder="Korisničko ime" placeholderTextColor="#666666" style={styles.input} value={username} onChangeText={setUsername} />
            <TextInput placeholder="Lozinka" placeholderTextColor="#666666" secureTextEntry style={styles.input} value={password} onChangeText={setPassword} />
            <Pressable style={({pressed}) => [styles.btn, (pressed || waiting) && styles.pressed]} onPress={handleSubmit} disabled={waiting}>
                <Text style={{ color: "#f2f2f2", fontSize: 22 }}>Registruj se</Text>
            </Pressable>
            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
}

export default Register;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
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
        color: "#000000",
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