import { useCallback, useState } from "react";
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useUser } from "../hooks/useUser";
import { Image } from "expo-image";
import musicLogo from "../assets/music.png";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const Preview = () => {
    const { filesToSend } = useUser();
    const router = useRouter();

    const [ignoreFiles, setIgnoreFiles] = useState([]);

    const handleSubmit = async () => {
        let currentIgnored = await AsyncStorage.getItem("ignoreFiles");
        let currentIgnoreFiles = [];
        if (currentIgnored !== null)
            currentIgnoreFiles = JSON.parse(currentIgnored);
        currentIgnoreFiles.push(...ignoreFiles);
        await AsyncStorage.setItem("ignoreFiles", JSON.stringify(currentIgnoreFiles));
        router.back();
    };

    const selectAll = () => {
        if (ignoreFiles.length !== filesToSend.length)
            setIgnoreFiles(filesToSend);
        else
            setIgnoreFiles([]);
    };

    const renderItem = useCallback(({item}) => (
        <View style={[styles.fileItem, ignoreFiles.includes(item) && { opacity: 0.5, backgroundColor: "red", borderWidth: 10, borderColor: "red" }]}
            onTouchEnd={() => {
            if (ignoreFiles.includes(item))
                setIgnoreFiles(prev => prev.filter(val => val !== item));
            else
                setIgnoreFiles(prev => [...prev, item]);
        }}>
            {[".mp3", ".aac", ".wav", "flac", ".amr", ".awb"].includes(item.substring(item.length - 4)) ?
            <View style={{ alignItems: "center", justifyContent: "center" }}>
                <Image source={musicLogo} style={{ width: "50%", height: "50%" }} contentFit="contain" />
                <Text style={{ textAlign: "center", fontSize: 18 }}>{item.substring(item.lastIndexOf("/") + 1)}</Text>
            </View> :
            <Image source={{ uri: "file:///storage/emulated/" + item }} contentFit="cover" placeholder="blurhash"
                style={{ width: "100%", height: "100%" }}/>}
        </View>
    ), [ignoreFiles]);

    const keyExtractor = useCallback((item) => item, []);

    const getItemLayout = useCallback((data, index) => ({ 
        length: Dimensions.get("window").width / 2 - 8,
        offset: (Dimensions.get("window").width / 2 - 8) * index,
        index
    }), []);

    return (
        <View style={styles.container}>
            <Text style={{ fontSize: 22 }}>Označeno {ignoreFiles.length} za ignorisanje</Text>
            <Pressable style={({pressed}) => [styles.btn, pressed && styles.pressed, { marginBottom: 10 }]} onPress={selectAll}>
                <Text style={{ color: "#f2f2f2", fontSize: 22 }}>Označi sve</Text>
            </Pressable>

            <FlatList data={filesToSend} numColumns={2} windowSize={11}
                keyExtractor={keyExtractor}
                getItemLayout={getItemLayout}
                renderItem={renderItem}/>

            <Pressable style={({pressed}) => [styles.btn, pressed && styles.pressed]} onPress={handleSubmit}>
                <Text style={{ color: "#f2f2f2", fontSize: 22 }}>Ignoriši označene</Text>
            </Pressable>
        </View>
    );
}

export default Preview;

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
        marginTop: 10,
        boxShadow: "0px 4px rgba(0,0,0,0.2)"
    },
    pressed: {
        opacity: 0.6
    },
    fileItem: {
        width: Dimensions.get("window").width / 2 - 8,
        height: Dimensions.get("window").width / 2 - 8,
        margin: 2,
        borderWidth: 2
    }
});