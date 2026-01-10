import { createContext, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from "@react-native-async-storage/async-storage";

export const UserContext = createContext();

export function UserProvider({ children })
{
    const usernameRegex = /^[a-z0-9]{4,}$/i;

    const router = useRouter();
    const pathname = usePathname();

    const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
    const [localAlbums, setLocalAlbums] = useState([]);
    const [localFilesCount, setLocalFilesCount] = useState(0);
    const [filesToSend, setFilesToSend] = useState([]);

    const [user, setUser] = useState(null);
    const [waiting, setWaiting] = useState(true);
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
                    await fetch("http://192.168.1.28:5152/api/user/login", {
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
                    await fetch("http://192.168.1.28:5152/api/user/insert", {
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
            await fetch("http://192.168.1.28:5152/api/user/update", {
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
                    throw new Error("Prijavi se ponovo");
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
                await fetch("http://192.168.1.28:5152/api/user/changepassword", {
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
                        throw new Error("Prijavi se ponovo");
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
        console.log("checkAlbums");
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
            console.log("checkFiles");
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

            fetch("http://192.168.1.28:5152/api/content/checkcontent", {
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
            }, () => {
                setFilesToSend([]);
            });
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
        }, 500);
        
        fetch("http://192.168.1.28:5152/api/user/status", {
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
                    fetch("http://192.168.1.28:5152/api/content/getusage?" + new URLSearchParams({
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
        else if (online && pathname === "/settings")
            checkLocalAlbums();
        else if (online && pathname === "/")
            checkLocalFiles();
    }, [online, pathname]);

    return (
        <UserContext.Provider value={{ user, waiting, online, usage, localAlbums, localFilesCount, filesToSend,
            login, register, logout, updateUser, changePassword }}>
            {children}
        </UserContext.Provider>
    );
}