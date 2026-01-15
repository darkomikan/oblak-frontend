import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useUser } from "../hooks/useUser";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Settings = () => {
    const { user, waiting, localAlbums, logout, updateUser, changePassword } = useUser();

    const [password, setPassword] = useState("");
    const [folders, setFolders] = useState(user?.Folders);
    const [error, setError] = useState(null);

    const handleUpdate = async () => {
        try
        {
            setError(null);
            await updateUser(undefined, folders);
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

    const handleIgnoreReset = async () => {
        await AsyncStorage.removeItem("ignoreFiles");
    };

    const renderItem = useCallback(({item}) => (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 10,
            paddingVertical: 5, backgroundColor: localAlbums.indexOf(item) % 2 === 1 ? "#d0d0d0ff" : "#afafafff"}}>
            <Text style={{ fontSize: 20, maxWidth: "80%" }}>{item}</Text>
            <Switch value={folders.includes(item)} style={{ transform: [{ scaleX: 1.25 }, { scaleY: 1.25 }] }}
                trackColor={{ true: "#0000aa", false: "#aa0000"}} thumbColor="#ffffdd" onValueChange={val => {
                if (!val)
                    setFolders(prev => prev.filter(folder => folder !== item));
                else
                    setFolders(prev => [...prev, item]);
            }}/>
        </View>
    ), [localAlbums, folders]);

    const keyExtractor = useCallback((item) => item, []);

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

            <Text style={{ fontSize: 22, marginBottom: 10 }}>Promjena lozinke:</Text>
            <TextInput placeholder="Nova lozinka" placeholderTextColor="#666666" secureTextEntry style={styles.input} value={password} onChangeText={setPassword} />
            <Pressable style={({pressed}) => [styles.btn, (pressed || waiting) && styles.pressed]} onPress={handleChangePassword} disabled={waiting}>
                <Text style={{ color: "#f2f2f2", fontSize: 22 }}>Promijeni lozinku</Text>
            </Pressable>
            {error && <Text style={styles.error}>{error}</Text>}

            <Text style={{ fontSize: 22, marginBottom: 10 }}>Lista albuma za čuvanje:</Text>
            <FlatList style={{ width: "80%", backgroundColor: "#d0d0d0ff", borderRadius: 6, marginBottom: 10 }}
                data={localAlbums} keyExtractor={keyExtractor} renderItem={renderItem}/>

            <Pressable style={({pressed}) => [styles.btn, { backgroundColor: "#cd6d00" }, pressed && styles.pressed]} onPress={handleIgnoreReset}>
                <Text style={{ color: "#f2f2f2", fontSize: 22 }}>Osvježi ignorisane datoteke</Text>
            </Pressable>
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
        paddingBottom: 50,
        backgroundColor: "#46bbf2ff"
    },
    btn: {
        backgroundColor: "#0022ffff",
        padding: 15,
        borderRadius: 6,
        marginBottom: 10,
        boxShadow: "0px 4px rgba(0,0,0,0.2)"
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
    error: {
        color: "#ff0000",
        padding: 10,
        backgroundColor: "#f5c1c8",
        borderColor: "#ff0000",
        borderWidth: 1,
        borderRadius: 6,
        marginHorizontal: 10,
        marginBottom: 5,
        fontSize: 22
    }
});