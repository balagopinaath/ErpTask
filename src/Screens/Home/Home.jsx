import { Alert, BackHandler, Linking, StyleSheet, Text, ToastAndroid, TouchableOpacity, View, useColorScheme } from 'react-native'
import React, { useEffect, useState } from 'react'
import { customColors, typography } from '../../Constants/helper';
import LocationIndicator from '../../Components/LocationIndicator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../Constants/api';
import Icon from 'react-native-vector-icons/AntDesign'
import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const colors = customColors[isDarkMode ? 'dark' : 'light'];
    const navigation = useNavigation();

    const [location, setLoction] = useState({ latitude: null, longitude: null })
    const [isActive, setIsActive] = useState(null);
    const [date, setDate] = useState();
    const [lastAttendance, setLastAttendance] = useState({});

    const [userId, setUserId] = useState({});
    const [name, setName] = useState();
    const [token, setToken] = useState();
    const [userType, setUserType] = useState();

    useEffect(() => {
        (async () => {
            try {
                const id = await AsyncStorage.getItem('UserId');
                const name = await AsyncStorage.getItem('Name');
                const token = await AsyncStorage.getItem('userToken');
                const userType = await AsyncStorage.getItem('UserType');
                setUserType(userType)
                fetchLastAttendance(id);
                setUserId(id)
                setToken(token)
                setName(name)
            } catch (err) {
                console.log('Error retrieving user data:', err);
            }
        })()
    }, [])

    useEffect(() => {
        if (userId) {
            fetchLastAttendance(userId);
        }
    }, [isActive]);

    const fetchLastAttendance = async (id) => {
        fetch(`${api.getLastAttendance}${id}`)
            .then(res => res.json())
            .then(data => {
                if (data?.success && data?.data?.length > 0) {
                    setIsActive(data.data[0].Active_Status)
                    if (data.data[0].Active_Status === 1) {
                        setDate(data.data[0].Start_Date)
                    } else {
                        setDate(data.data[0].End_Date)
                    }
                    setLastAttendance(data?.data[0])
                }
            })
    }

    const handleLocationUpdate = (locationData) => {
        setLoction({
            latitude: locationData.latitude,
            longitude: locationData.longitude,
        })
    };

    const handleStartDay = () => {
        console.log(location)
        fetch(api.attendance, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                UserId: userId,
                Latitude: location.latitude,
                Longitude: location.longitude,
            })
        }).then(res => res.json())
            .then(data => {
                if (data.success) {
                    ToastAndroid.show(data.message, ToastAndroid.LONG)
                    setIsActive(1);
                } else {
                    ToastAndroid.show(data.message, ToastAndroid.LONG)
                }
            })
    };

    const handleEndDay = () => {
        fetch(api.attendance, {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Id: lastAttendance.Id,
                Description: 'Mobile Testing'
            })
        }).then(res => res.json())
            .then(data => {
                if (data.success) {
                    ToastAndroid.show(data.message, ToastAndroid.LONG)
                    setIsActive(0)
                } else {
                    ToastAndroid.show(data.message, ToastAndroid.LONG)
                }
            })
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('UserId');
            await AsyncStorage.removeItem('Company_Id');
            await AsyncStorage.removeItem('userName');
            await AsyncStorage.removeItem('Name');
            await AsyncStorage.removeItem('UserType');
            await AsyncStorage.removeItem('branchId');
            await AsyncStorage.removeItem('branchName');
            await AsyncStorage.removeItem('userTypeId');
            navigation.replace('Splash');
            ToastAndroid.show("You have been logged out!", ToastAndroid.LONG)
        } catch (e) {
            console.log('Error logging out:', e);
        }
    }

    return (
        <View style={styles(colors).container}>

            <View style={styles(colors).header} >
                <Text style={styles(colors).headerContent}>Welcome, {name}</Text>
                <TouchableOpacity onPress={() => logout()}>
                    <Icon name="logout" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {userType === 'EMPLOYEE' && (
                <React.Fragment>
                    <LocationIndicator onLocationUpdate={handleLocationUpdate} />

                    <View style={styles(colors).card}>
                        <Text style={styles(colors).cardTitle}>Day Tracking</Text>
                        <View style={styles(colors).timeContainer}>
                            <View>
                                <Text style={styles(colors).timeText}>
                                    {date
                                        ? `${isActive === 1 ? 'Start' : 'End'} Date: ${new Date(date).toISOString().substring(0, 10)}`
                                        : `${isActive === 1 ? 'Start' : 'End'} Date: Not ${isActive === 1 ? 'Started' : 'Ended'}`
                                    }
                                </Text>
                                <Text style={styles(colors).timeText}>
                                    {date
                                        ? `${isActive === 1 ? 'Start' : 'End'} Time: ${new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}`
                                        : `${isActive === 1 ? 'Start' : 'End'} Time: Not ${isActive === 1 ? 'Started' : 'Ended'}`
                                    }
                                </Text>
                            </View>
                            {isActive === 0 ? (
                                <TouchableOpacity onPress={handleStartDay} style={[styles(colors).button, { backgroundColor: isActive === 0 ? colors.primary : colors.accent }]}>
                                    <Text style={styles(colors).buttonText}>Start Day</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity onPress={handleEndDay} style={[styles(colors).button, { backgroundColor: isActive === 0 ? colors.primary : colors.accent }]}>
                                    <Text style={styles(colors).buttonText}>End Day</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </React.Fragment>
            )}

            <View style={styles(colors).webCard}>
                <TouchableOpacity
                    style={styles(colors).iconView}
                    onPress={() => {
                        const url = `https://erpsmt.in?Auth=${token}`;
                        Linking.openURL(url);
                    }}>
                    <Icon name="barschart" size={25} color={colors.primary} />
                    <Text style={styles(colors).text}>ERP APP</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles(colors).iconView}
                    onPress={() => {
                        const url = `https://erpsmt.in?Auth=${token}`;
                        Linking.openURL(url);
                    }}>
                    <Icon name="barschart" size={25} color={colors.primary} />
                    <Text style={styles(colors).text}>Task APP</Text>
                </TouchableOpacity>
            </View>


        </View>
    );

}

export default HomeScreen

const styles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.primary,
        padding: 15,
    },
    headerContent: {
        ...typography.h3(colors),
        color: colors.white,
    },

    card: {
        backgroundColor: colors.background,
        padding: 16,
        borderRadius: 8,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        width: '80%',
        alignSelf: 'center',
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 6,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: 'bold',
    },
    timeText: {
        fontSize: 16,
    },




    webCard: {
        flexDirection: 'row',
        backgroundColor: colors.background,
        borderRadius: 10,
        padding: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        marginVertical: 10,
        marginHorizontal: 20,
    },
    iconView: {
        alignItems: 'center',
        marginHorizontal: 10,
    },
    text: {
        color: colors.text,
        marginTop: 10,
    },
})