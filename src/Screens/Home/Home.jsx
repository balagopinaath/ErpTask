import { StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View, Modal, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/AntDesign';

import { useNavigation } from '@react-navigation/native';
import { typography } from '../../Constants/helper';
import { useThemeContext } from '../../Context/ThemeContext';
import { api } from '../../Constants/api';
import LocationIndicator from '../../Components/LocationIndicator';

const HomeScreen = () => {
    const { colors, customStyles } = useThemeContext();
    const navigation = useNavigation();

    const [location, setLocation] = useState({ latitude: null, longitude: null });
    const [isActive, setIsActive] = useState(null);
    const [date, setDate] = useState(null);
    const [lastAttendance, setLastAttendance] = useState({});
    const [modalVisible, setModalVisible] = useState(false);
    const [description, setDescription] = useState('');

    const [userId, setUserId] = useState(null);
    const [name, setName] = useState(null);
    const [token, setToken] = useState(null);
    const [userType, setUserType] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const id = await AsyncStorage.getItem('UserId');
                const name = await AsyncStorage.getItem('Name');
                const token = await AsyncStorage.getItem('userToken');
                const userType = await AsyncStorage.getItem('UserType');
                setUserType(userType);
                fetchLastAttendance(id);
                setUserId(id);
                setToken(token);
                setName(name);
            } catch (err) {
                console.log('Error retrieving user data:', err);
            }
        })();
    }, []);

    useEffect(() => {
        if (userId) {
            fetchLastAttendance(userId);
        }
    }, [isActive]);

    const fetchLastAttendance = async (id) => {
        // console.log(`${api.getLastAttendance}${id}`)
        try {
            const response = await fetch(`${api.getLastAttendance}${id}`);
            const data = await response.json();
            if (data.success && data.data && data.data.length > 0) {
                setIsActive(data.data[0].Active_Status);
                setDate(data.data[0].Active_Status === 1 ? data.data[0].Start_Date : data.data[0].End_Date);
                setLastAttendance(data.data[0]);
            }
        } catch (error) {
            console.log('Error fetching last attendance:', error);
        }
    };

    const handleLocationUpdate = (locationData) => {
        setLocation({
            latitude: locationData.latitude,
            longitude: locationData.longitude,
        });
    };

    const handleStartDay = () => {
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
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    ToastAndroid.show(data.message, ToastAndroid.LONG);
                    setIsActive(1);
                } else {
                    ToastAndroid.show(data.message, ToastAndroid.LONG);
                }
            })
            .catch(error => {
                console.log('Error starting day:', error);
            });
    };

    const showEndDayModal = () => {
        setModalVisible(true);
    };

    const handleEndDay = () => {
        fetch(api.attendance, {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Id: lastAttendance.Id,
                Description: description,
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    ToastAndroid.show(data.message, ToastAndroid.LONG);
                    setIsActive(0);
                } else {
                    ToastAndroid.show(data.message, ToastAndroid.LONG);
                }
                setModalVisible(false);
                setDescription('')
            })
            .catch(error => {
                ToastAndroid.show('Error ending day:', error, ToastAndroid.LONG);
            });
    };

    const logout = async () => {
        try {
            await AsyncStorage.multiRemove([
                'userToken',
                'UserId',
                'Company_Id',
                'userName',
                'Name',
                'UserType',
                'branchId',
                'branchName',
                'userTypeId'
            ]);
            navigation.replace('Splash');
            ToastAndroid.show("You have been logged out!", ToastAndroid.LONG);
        } catch (e) {
            console.log('Error logging out:', e);
        }
    };

    return (
        <View style={customStyles.container}>
            <View style={styles(colors).header}>
                <Text style={styles(colors).headerContent}>Welcome, {name}</Text>
                <TouchableOpacity onPress={() => logout()}>
                    <Icon name="logout" size={22} color="white" />
                </TouchableOpacity>
            </View>

            {userType === 'EMPLOYEE' && (
                <>
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
                                <TouchableOpacity onPress={handleStartDay} style={[styles(colors).button, { backgroundColor: colors.primary }]}>
                                    <Text style={styles(colors).buttonText}>Start Day</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity onPress={showEndDayModal} style={[styles(colors).button, { backgroundColor: colors.accent }]}>
                                    <Text style={styles(colors).buttonText}>End Day</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </>
            )}

            <View style={styles(colors).webCard}>
                <View style={styles(colors).webCardView}>
                    <TouchableOpacity
                        style={styles(colors).iconView}
                        onPress={() => {
                            navigation.navigate('WebViewScreen',
                                { url: `https://erpsmt.in?Auth=${token}` }
                            );
                        }}>
                        <Image source={userType === 'EMPLOYEE'
                            ? require('../../../assets/images/clipboard.png')
                            : require('../../../assets/images/analytics.png')}
                            style={styles(colors).logo}
                        />
                        <Text style={styles(colors).text}>{userType === 'EMPLOYEE' ? "Task" : "ERP"}</Text>
                    </TouchableOpacity>

                    {userType !== 'EMPLOYEE' && (
                        <React.Fragment>
                            <TouchableOpacity
                                style={styles(colors).iconView}
                                onPress={() => {
                                    navigation.navigate('GodownActivities');
                                }}>
                                <Image
                                    source={require('../../../assets/images/box.png')}
                                    style={styles(colors).logo}
                                />
                                <Text style={styles(colors).text}>Godown Activities</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles(colors).iconView}
                                onPress={() => {
                                    navigation.navigate('DriverActivities');
                                }}>
                                <Image source={require('../../../assets/images/driver.png')}
                                    style={styles(colors).logo}
                                />
                                <Text style={styles(colors).text}>Driver Activities</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles(colors).iconView}
                                onPress={() => {
                                    navigation.navigate('DeliveryActivities');
                                }}>
                                <Image source={require('../../../assets/images/fast-delivery.png')}
                                    style={styles(colors).logo}
                                />
                                <Text style={styles(colors).text}>Delivery Activities</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles(colors).iconView}
                                onPress={() => {
                                    navigation.navigate('StaffActivities');
                                }}>
                                <Image source={require('../../../assets/images/teamwork.png')}
                                    style={styles(colors).logo}
                                />
                                <Text style={styles(colors).text}>Staff Activities</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles(colors).iconView}
                                onPress={() => {
                                    navigation.navigate('InwardsActivities');
                                }}>
                                <Image source={require('../../../assets/images/tool.png')}
                                    style={styles(colors).logo}
                                />
                                <Text style={styles(colors).text}>Inwards Activities</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles(colors).iconView}
                                onPress={() => {
                                    navigation.navigate("WCActivities");
                                }}>
                                <Image source={require('../../../assets/images/measure.png')}
                                    style={styles(colors).logo}
                                />
                                <Text style={styles(colors).text}>Weight Checks</Text>
                            </TouchableOpacity>
                        </React.Fragment>
                    )}
                </View>
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={(styles(colors).centeredView)}>
                    <View style={styles(colors).modalView}>
                        <Text style={styles(colors).modalText}>End Day Description</Text>
                        <TextInput
                            style={styles(colors).input}
                            placeholder="Enter description"
                            value={description}
                            onChangeText={setDescription}
                        />
                        <View style={styles(colors).buttonGroup}>
                            <TouchableOpacity
                                style={[styles(colors).button, { backgroundColor: colors.accent }]}
                                onPress={handleEndDay}
                            >
                                <Text style={styles(colors).buttonText}>Submit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles(colors).button, { backgroundColor: colors.primary, marginLeft: 15 }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles(colors).buttonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal >
            <View style={styles(colors).bottomBackground}>
                {/* Bottom background object */}
            </View>
        </View>
    );
};

export default HomeScreen

const styles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        height: '8%',
        justifyContent: 'space-between',
        backgroundColor: colors.primary,
        padding: 15,
        marginBottom: 20,
    },
    headerContent: {
        ...typography.h5(colors),
        color: colors.white,
    },
    card: {
        width: "90%",
        alignSelf: 'center',
        backgroundColor: colors.background,
        padding: 20,
        borderRadius: 10,
        marginVertical: 8,
        shadowColor: colors.background === "#000000" ? colors.white : colors.black,
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 2,
    },
    cardTitle: {
        textAlign: 'left',
        ...typography.h5(colors),
        fontWeight: 'bold',
        marginBottom: 15,
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
        borderRadius: 8,
    },
    buttonText: {
        ...typography.button(colors),
        color: colors.white,
        fontWeight: 'bold',
    },
    timeText: {
        ...typography.body1(colors),
        color: colors.text,
    },
    webCard: {
        width: "90%",
        alignSelf: 'center',
        flexDirection: 'column',
        backgroundColor: colors.background,
        borderRadius: 10,
        elevation: 2,
        shadowColor: colors.background === "#000000" ? colors.white : colors.black,
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        padding: 15,
        marginVertical: 10,
    },
    webCardView: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: "wrap",
        paddingHorizontal: 5,
    },
    iconView: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0.75,
        borderRadius: 10,
        marginVertical: 10
    },
    logo: {
        width: 35,
        height: 35,
    },
    text: {
        textAlign: 'center',
        ...typography.body1(colors),
        color: colors.text,
        marginTop: 5,
    },
    centeredView: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)'
    },
    modalView: {
        margin: 20,
        backgroundColor: colors.secondary,
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalText: {
        marginBottom: 10,
        textAlign: 'center',
        ...typography.h3(colors),
    },
    input: {
        ...typography.h6(colors),
        borderWidth: 1,
        borderColor: colors.textSecondary,
        width: 250,
        borderRadius: 10,
        padding: 12,
        color: colors.text,
        marginVertical: 15,
        backgroundColor: colors.background
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        width: '100%',
        paddingHorizontal: 20
    },
    bottomBackground: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: "6%",
        backgroundColor: colors.primary,
        borderTopLeftRadius: 100,
    },
});