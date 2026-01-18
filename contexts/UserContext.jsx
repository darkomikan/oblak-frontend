import { createContext, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as MediaLibrary from 'expo-media-library';
import * as IntentLauncher from 'expo-intent-launcher';
import { File } from "expo-file-system";
import * as Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PermissionsAndroid, Platform } from "react-native";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";

export const UserContext = createContext();

export function UserProvider({ children })
{
    const usernameRegex = /^[a-z0-9]{4,}$/i;
    const chunkSize = 5 * 1024 * 1024;

    const sleeper = ms => new Promise(r => setTimeout(r, ms));
    const router = useRouter();
    const pathname = usePathname();

    const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
    const [localAlbums, setLocalAlbums] = useState([]);
    const [localFilesCount, setLocalFilesCount] = useState(0);
    const [filesToSend, setFilesToSend] = useState([]);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, max: 1 });
    const [uploadSpeed, setUploadSpeed] = useState(0);
    const [uploadCount, setUploadCount] = useState(0);

    const [user, setUser] = useState(null);
    const [waiting, setWaiting] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [online, setOnline] = useState(false);
    const [usage, setUsage] = useState(0);

    async function login(username, password)
    {
        try
        {
            if (usernameRegex.test(username))
            {
                if (password.length >= 8)
                {
                    await fetch("http://192.168.1.100:7070/api/user/login", {
                        method: "POST",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            Username: username,
                            Password: password
                        })
                    }).then(async res => {
                        if (res.status < 400)
                        {
                            let data = await res.json();
                            setUser(data);
                            await SecureStore.setItemAsync("userData", JSON.stringify(data));
                            router.replace("/");
                        }
                        else if (res.status === 401)
                            throw new Error("Netačna lozinka ili korisničko ime");
                    }, () => {
                        throw new Error("Veza sa oblakom nije uspostavljena");
                    });
                }
                else
                    throw new Error("Lozinka mora imati minimum 8 karaktera");
            }
            else
                throw new Error("Korisničko ime mora imati minimum 4 slova ili broja");
        }
        catch (error)
        {
            throw Error(error.message);
        }
    }

    async function register(username, password)
    {
        try
        {
            if (usernameRegex.test(username))
            {
                if (password.length >= 8)
                {
                    await fetch("http://192.168.1.100:7070/api/user/insert", {
                        method: "POST",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            Username: username,
                            Password: password
                        })
                    }).then(async res => {
                        if (res.status < 400)
                            await login(username, password);
                        else if (res.status === 400)
                            throw new Error("Korisničko ime " + username + " je zauzeto");
                    }, () => {
                        throw new Error("Veza sa oblakom nije uspostavljena");
                    });
                }
                else
                    throw new Error("Lozinka mora imati minimum 8 karaktera");
            }
            else
                throw new Error("Korisničko ime mora imati minimum 4 slova ili broja");
        }
        catch (error)
        {
            throw Error(error.message);
        }
    }

    async function updateUser(lastSync = user.LastSync, folders = user.Folders)
    {
        try
        {
            lastSync = lastSync.substring(0, 19) + ".000Z";
            await fetch("http://192.168.1.100:7070/api/user/update", {
                method: "PUT",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + user.Password
                },
                body: JSON.stringify({
                    Id: user.Id,
                    Username: user.Username,
                    Password: "",
                    LastSync: lastSync,
                    Folders: folders
                })
            }).then(async res => {
                if (res.ok)
                {
                    let data = {
                        Id: user.Id,
                        Username: user.Username,
                        Password: user.Password,
                        LastSync: lastSync,
                        Folders: folders
                    };
                    setUser(data);
                    await SecureStore.setItemAsync("userData", JSON.stringify(data));
                    router.replace("/");
                }
                else if (res.status === 400)
                    throw new Error("Neočekivana greška");
                else if (res.status === 401)
                    logout();
            }, () => {
                throw new Error("Veza sa oblakom nije uspostavljena");
            });
        }
        catch (error)
        {
            throw Error(error.message);
        }
    }

    async function changePassword(password)
    {
        try
        {
            if (password.length >= 8)
            {
                await fetch("http://192.168.1.100:7070/api/user/changepassword", {
                    method: "PUT",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + user.Password
                    },
                    body: JSON.stringify({
                        Username: user.Username,
                        Password: password
                    })
                }).then(async res => {
                    if (res.ok)
                        router.replace("/");
                    else if (res.status === 401)
                        logout();
                }, () => {
                    throw new Error("Veza sa oblakom nije uspostavljena");
                });
            }
            else
                throw new Error("Lozinka mora imati minimum 8 karaktera");
        }
        catch (error)
        {
            throw Error(error.message);
        }
    }

    async function logout()
    {
        await SecureStore.deleteItemAsync("userData");
        setUser(null);
        router.replace("/");
    }

    async function checkLocalAlbums()
    {
        if (permissionResponse.status !== "granted")
        {
            if ((await requestPermission()).status !== "granted")
                return;
        }
        const fetchedAlbums = await MediaLibrary.getAlbumsAsync({
            includeSmartAlbums: true
        });
        const albumsArray = [];
        fetchedAlbums.forEach(async album => {
            if (!albumsArray.includes(album.title))
                albumsArray.push(album.title);
        });
        albumsArray.sort();
        setLocalAlbums(albumsArray);
    }

    async function checkLocalFiles()
    {
        if (user !== null && filesToSend !== null)
        {
            setLocalFilesCount(0);
            setFilesToSend(null);
            if (permissionResponse.status !== "granted")
            {
                if ((await requestPermission()).status !== "granted")
                    return;
            }
            const fetchedAlbums = await MediaLibrary.getAlbumsAsync({
                includeSmartAlbums: true
            });

            let ignored = await AsyncStorage.getItem("ignoreFiles");
            let ignoreFiles = [];
            if (ignored !== null)
                ignoreFiles = JSON.parse(ignored);

            let localFilesList = [];
            for (const album of fetchedAlbums)
            {
                if (user?.Folders.includes(album.title))
                {
                    let assets = null;
                    do
                    {
                        assets = await MediaLibrary.getAssetsAsync({ album: album, mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.audio,
                            MediaLibrary.MediaType.video], after: assets?.endCursor });
                        assets.assets.forEach(med => {
                            let shortUri = med.uri.substring(25);
                            if (!ignoreFiles.includes(shortUri))
                            {
                                setLocalFilesCount(prev => prev + 1);
                                localFilesList.push(shortUri);
                            }
                        });
                    } while (assets.hasNextPage);
                }
            }

            fetch("http://192.168.1.100:7070/api/content/checkcontent", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + user.Password
                },
                body: JSON.stringify({
                    Username: user.Username,
                    LocalContent: localFilesList
                })
            }).then(async res => {
                if (res.ok)
                {
                    let files = await res.json();
                    setFilesToSend(files);
                }
                else if (res.status === 401)
                    logout();
            }, () => {
                setFilesToSend([]);
            });
        }
    }

    async function uploadFile(uri, ws)
    {
        let fh = null;
        try
        {
            const file = new File("file:///storage/emulated/" + uri);
            if (file.info().size >= 2147483648)
                return false;
            fh = file.open();
            
            const fileSize = fh.size;
            const totalChunks = Math.ceil(fileSize / chunkSize);

            let resolver = null;
            let i;

            ws.onmessage = (res) => {
                if (resolver !== null)
                    resolver();
                if (res.data === "error")
                    i = totalChunks + 1;
                else if (res.data !== "ok")
                    setUploadProgress(prev => ({ current: prev.current + Number(res.data), max: prev.max }));
            };

            ws.send(JSON.stringify({
                CreationTime: file.info().creationTime,
                LastWriteTime: file.info().modificationTime,
                Username: user.Username,
                Uri: uri
            }));

            let timestamp;
            for (i = 0; i < totalChunks; ++i)
            {
                await sleeper(30);
                const start = i * chunkSize;
                const end = Math.min(start + chunkSize, fileSize);

                fh.offset = start;
                const bytes = fh.readBytes(end - start);

                timestamp = new Date().getTime();
                await new Promise((resolve) => {
                    resolver = resolve;
                    ws.send(bytes);
                });
                if ((end - start) > 1024)
                    setUploadSpeed((((end - start) * 1000) / ((new Date().getTime() - timestamp) * 1024 * 1024)).toFixed(2));
            }
            if (i === totalChunks)
            {
                await sleeper(30);
                ws.send("ok");
                return true;
            }
            else
                return false;
        }
        catch (error)
        {
            if (fh !== null)
                console.log(error);
            return false;
        }
        finally
        {
            if (fh !== null)
                fh.close();
        }
    }

    async function checkFilesPermission()
    {
        if (Platform.OS === "android" && Platform.Version < 30)
        {
            await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            {
                title: "Dozvola za pristup",
                message: "Aplikaciji treba dozvola za pristup datotekama za čitanje.",
                buttonNeutral: "Kasnije",
                buttonNegative: "Ne",
                buttonPositive: "OK"
            });
        }
        else
        {
            const packageName = Constants.default.expoConfig.android.package;
            const intentAction = "android.settings.MANAGE_APP_ALL_FILES_ACCESS_PERMISSION";
            await IntentLauncher.startActivityAsync(intentAction, { data: `package:${packageName}` });
        }
    }

    async function sendMissingFiles()
    {
        if (filesToSend !== null && filesToSend.length > 0)
        {
            try
            {
                const file = new File("file:///storage/emulated/" + filesToSend[0]);
                const fh = file.open();
                fh.close();
            }
            catch
            {
                await checkFilesPermission();
                return;
            }

            setUploading(true);
            setUploadProgress({ current: 0, max: 1 });
            setUploadCount(0);
            setUploadSpeed(0);
            await activateKeepAwakeAsync();
            await sleeper(30);

            const ws = new WebSocket("ws://192.168.1.100:7071");
            ws.onopen = async () => {
                console.log("ws opened...");

                for (let i = 0; i < filesToSend.length; ++i)
                {
                    let result = await uploadFile(filesToSend[i], ws);
                    if (result)
                        setUploadCount(prev => prev + 1);
                    else
                        console.log("missed " + filesToSend[i]);
                }
                await sleeper(100);
                ws.close();
            };
            ws.onerror = (e) => {
                console.log("ws error: " + e.type);
            };
            ws.onclose = (e) => {
                console.log("ws closed: " + e.code + ", " + e.reason);
                deactivateKeepAwake();
                setUploading(false);
                checkLocalFiles();
            };

            // should go to separate task, or not
            let fullSize = 0;
            for (let i = 0; i < filesToSend.length; ++i)
            {
                try
                {
                    const file = new File("file:///storage/emulated/" + filesToSend[i]);
                    fullSize += file.info().size;
                }
                catch
                { }
            }
            setUploadProgress({ current: 0, max: fullSize });
        }
    }

    const getUserData = useCallback(async () => { 
        const data = await SecureStore.getItemAsync("userData");
        if (data && data.includes("Username"))
            return JSON.parse(data);
        return null;
    }, []);

    const checkStatus = useCallback(() => {
        const waitingTimeout = setTimeout(() => {
            setWaiting(true);
        }, 1000);
        
        fetch("http://192.168.1.100:7070/api/user/status", {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            }
        }).then(res => {
            if (res.ok)
            {
                clearTimeout(waitingTimeout);
                setOnline(true);
                if (user)
                {
                    fetch("http://192.168.1.100:7070/api/content/getusage?" + new URLSearchParams({
                            username: user.Username
                    }).toString(), {
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                            Authorization: "Bearer " + user.Password
                        }
                    }).then(async res => {
                        if (res.ok)
                        {
                            let mb = await res.json();
                            setUsage(mb.toFixed(2));
                        }
                        else if (res.status === 401)
                            logout();
                    }, () => {
                        setOnline(false);
                    });
                }
            }
            else
                setOnline(false);
        }, () => {
            setOnline(false);
        }).finally(() => {
            setWaiting(false);
        });
    }, [user]);

    useEffect(() => {
        const setUserData = async () => {
            setUser(await getUserData());
        };
        setUserData();
    }, [getUserData]);

    useEffect(() => {
        checkStatus();
    }, [checkStatus]);

    useEffect(() => {
        const autoCheck = setInterval(() => {
            if (!waiting)
                checkStatus();
        }, 5000);

        return () => { clearInterval(autoCheck); };
    }, [waiting, checkStatus]);

    useEffect(() => {
        if (!online && pathname !== "/" && pathname !== "/preview")
            router.replace("/");
        else if (online && pathname === "/")
            checkLocalFiles();
    }, [online, pathname]);

    return (
        <UserContext.Provider value={{ user, waiting, online, usage, localAlbums, localFilesCount, filesToSend, uploading,
            uploadProgress, uploadSpeed, uploadCount, login, register, logout, updateUser, changePassword, checkLocalAlbums, sendMissingFiles }}>
            {children}
        </UserContext.Provider>
    );
}