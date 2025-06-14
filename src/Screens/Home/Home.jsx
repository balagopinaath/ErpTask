import {
    StyleSheet,
    Text,
    TextInput,
    ToastAndroid,
    TouchableOpacity,
    View,
    Modal,
    ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/AntDesign";
import FeatherIcon from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";

import { useThemeContext } from "../../Context/ThemeContext";
import { customColors, typography } from "../../Constants/helper";
import { api } from "../../Constants/api";

const HomeScreen = () => {
    const { colors, customStyles } = useThemeContext();
    const navigation = useNavigation();

    const [location, setLocation] = useState({
        latitude: null,
        longitude: null,
    });
    const [isActive, setIsActive] = useState(null);
    const [date, setDate] = useState(null);
    const [lastAttendance, setLastAttendance] = useState({});
    const [modalVisible, setModalVisible] = useState(false);
    const [description, setDescription] = useState("");

    const [userId, setUserId] = useState(null);
    const [name, setName] = useState(null);
    const [token, setToken] = useState(null);
    const [userType, setUserType] = useState(null);

    const [fingerPrint, setFingerPrint] = useState(null);
    const [logDate, setLogDate] = useState(null);
    const [logDateTime, setLogDateTime] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [attendanceStatus, setAttendanceStatus] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const id = await AsyncStorage.getItem("UserId");
                const name = await AsyncStorage.getItem("Name");
                const token = await AsyncStorage.getItem("userToken");
                const userType = await AsyncStorage.getItem("UserType");
                setUserType(userType);
                fetchLastAttendance(id);
                setUserId(id);
                setToken(token);
                setName(name);
            } catch (err) {
                console.log("Error retrieving user data: ", err);
            }
        })();
    }, []);

    useEffect(() => {
        if (userId) {
            fetchLastAttendance(userId);
            fetchEmpDetailsAttendance();
        }
    }, [isActive]);

    const formatTo12HourClock = isoDateTime => {
        if (!isoDateTime) return "Not Available";

        const date = new Date(isoDateTime);
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? "PM" : "AM";

        hours = hours % 12 || 12;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

        return `${hours}:${formattedMinutes} ${ampm}`;
    };

    const fetchEmpDetailsAttendance = async () => {
        try {
            const response = await fetch(api.getEmpDetailsAttendance);
            const data = await response.json();

            if (data.success && Array.isArray(data.data)) {
                const employee = data.data.find(emp => emp.username === name);

                if (employee) {
                    setLogDate(
                        employee.MobileLogin_InTime
                            ? employee.MobileLogin_InTime.split("T")[0]
                            : "Not Available",
                    );
                    setAttendanceStatus(
                        employee.AttendanceStatus || "Not Available",
                    );
                    setLogDateTime(
                        employee.MobileLogin_InTime || "Not Available",
                    );
                    setLogDateTime(
                        formatTo12HourClock(employee.MobileLogin_InTime),
                    );
                } else {
                    console.log("Employee not found.");
                }
            } else {
                console.error(
                    "Unexpected response structure or empty data:",
                    data,
                );
            }
        } catch (error) {
            console.error("Error fetching employee details: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchLastAttendance = async id => {
        // console.log(`${api.getLastAttendance}${id}`)
        try {
            const response = await fetch(`${api.getLastAttendance}${id}`);
            const data = await response.json();
            if (data.success && data.data && data.data.length > 0) {
                setIsActive(data.data[0].Active_Status);
                setDate(
                    data.data[0].Active_Status === 1
                        ? data.data[0].Start_Date
                        : data.data[0].End_Date,
                );
                setLastAttendance(data.data[0]);
            }
        } catch (error) {
            console.log("Error fetching last attendance:", error);
        }
    };

    const handleLocationUpdate = locationData => {
        setLocation({
            latitude: locationData.latitude,
            longitude: locationData.longitude,
        });
    };

    const handleStartDay = () => {
        fetch(api.attendance, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                UserId: userId,
                Latitude: location.latitude,
                Longitude: location.longitude,
            }),
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
                console.log("Error starting day:", error);
            });
    };

    const showEndDayModal = () => {
        setModalVisible(true);
    };

    const handleEndDay = () => {
        fetch(api.attendance, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                Id: lastAttendance.Id,
                Description: description,
            }),
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
                setDescription("");
            })
            .catch(error => {
                ToastAndroid.show(
                    "Error ending day:",
                    error,
                    ToastAndroid.LONG,
                );
            });
    };

    const logout = async () => {
        try {
            await AsyncStorage.multiRemove([
                "userToken",
                "UserId",
                "Company_Id",
                "userName",
                "Name",
                "UserType",
                "branchId",
                "branchName",
                "userTypeId",
            ]);
            navigation.replace("Splash");
            ToastAndroid.show("You have been logged out!", ToastAndroid.LONG);
        } catch (e) {
            console.log("Error logging out:", e);
        }
    };

    return (
        <View style={customStyles.container}>
            <View style={styles(colors).header}>
                <Text style={styles(colors).headerContent}>
                    Welcome back, {name}
                </Text>
                <TouchableOpacity onPress={() => logout()}>
                    <Icon name="logout" size={22} color={colors.white} />
                </TouchableOpacity>
            </View>

            {userType === "EMPLOYEE" && (
                <>
                    {/* <LocationIndicator onLocationUpdate={handleLocationUpdate} />
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
                    </View> */}

                    <View style={styles(colors).statusCard}>
                        <View style={styles(colors).statusHeader}>
                            <Text style={styles(colors).statusTitle}>
                                Attendance Status
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    navigation.navigate("AttendanceInfo");
                                }}>
                                <FeatherIcon
                                    name="arrow-up-right"
                                    size={18}
                                    color="#64748b"
                                />
                            </TouchableOpacity>
                        </View>
                        <View style={styles(colors).statusRow}>
                            <View style={styles(colors).statusItem}>
                                <Text style={styles(colors).statusLabel}>
                                    Date
                                </Text>
                                <Text style={styles(colors).statusValue}>
                                    {logDate || "N/A"}
                                </Text>
                            </View>
                            <View style={styles(colors).statusDivider} />
                            <View style={styles(colors).statusItem}>
                                <Text style={styles(colors).statusLabel}>
                                    Time
                                </Text>
                                <Text style={styles(colors).statusValue}>
                                    {logDateTime || "N/A"}
                                </Text>
                            </View>
                        </View>
                        <View style={styles(colors).statusFooter}>
                            <Icon
                                name="clockcircle"
                                size={16}
                                color={colors.primary}
                            />
                            <Text style={styles(colors).statusText}>
                                {attendanceStatus || "Not Available"}
                            </Text>
                        </View>
                    </View>
                </>
            )}

            <ScrollView style={styles(colors).menuContainer}>
                <View style={styles(colors).menuGrid}>
                    <TouchableOpacity
                        style={styles(colors).menuItem}
                        onPress={() => {
                            navigation.navigate("WebViewScreen", {
                                url: `https://erpsmt.in?Auth=${token}`,
                            });
                        }}>
                        <View style={styles(colors).menuIcon}>
                            <Icon
                                name="appstore1"
                                size={24}
                                color={colors.primary}
                            />
                        </View>
                        <Text style={styles(colors).menuText}>ERP</Text>
                    </TouchableOpacity>

                    {userType === "EMPLOYEE" && (
                        <TouchableOpacity
                            style={styles(colors).menuItem}
                            onPress={() => {
                                navigation.navigate("TodayTask");
                            }}>
                            <View style={styles(colors).menuIcon}>
                                <Icon
                                    name="calendar"
                                    size={24}
                                    color={colors.primary}
                                />
                            </View>
                            <Text style={styles(colors).menuText}>
                                Today's Tasks
                            </Text>
                        </TouchableOpacity>
                    )}

                    {userType !== "EMPLOYEE" && (
                        <React.Fragment>
                            <TouchableOpacity
                                style={styles(colors).menuItem}
                                onPress={() => {
                                    navigation.navigate("GodownActivities");
                                }}>
                                <View style={styles(colors).menuIcon}>
                                    <Icon
                                        name="inbox"
                                        size={24}
                                        color={colors.primary}
                                    />
                                </View>
                                <Text style={styles(colors).menuText}>
                                    Godown Activities
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles(colors).menuItem}
                                onPress={() => {
                                    navigation.navigate("DriverActivities");
                                }}>
                                <View style={styles(colors).menuIcon}>
                                    <Icon
                                        name="car"
                                        size={24}
                                        color={colors.primary}
                                    />
                                </View>
                                <Text style={styles(colors).menuText}>
                                    Driver Activities
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles(colors).menuItem}
                                onPress={() => {
                                    navigation.navigate("DeliveryActivities");
                                }}>
                                <View style={styles(colors).menuIcon}>
                                    <Icon
                                        name="inbox"
                                        size={24}
                                        color={colors.primary}
                                    />
                                </View>
                                <Text style={styles(colors).menuText}>
                                    Delivery Activities
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles(colors).menuItem}
                                onPress={() => {
                                    navigation.navigate("StaffActivities");
                                }}>
                                <View style={styles(colors).menuIcon}>
                                    <Icon
                                        name="team"
                                        size={24}
                                        color={colors.primary}
                                    />
                                </View>
                                <Text style={styles(colors).menuText}>
                                    Staff Activities
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles(colors).menuItem}
                                onPress={() => {
                                    navigation.navigate("InwardsActivities");
                                }}>
                                <View style={styles(colors).menuIcon}>
                                    <Icon
                                        name="download"
                                        size={24}
                                        color={colors.primary}
                                    />
                                </View>
                                <Text style={styles(colors).menuText}>
                                    Inwards Activities
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles(colors).menuItem}
                                onPress={() => {
                                    navigation.navigate("WCActivities");
                                }}>
                                <View style={styles(colors).menuIcon}>
                                    <Icon
                                        name="dashboard"
                                        size={24}
                                        color={colors.primary}
                                    />
                                </View>
                                <Text style={styles(colors).menuText}>
                                    Weight Checks
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles(colors).menuItem}
                                onPress={() => {
                                    navigation.navigate("OverAllAbstract");
                                }}>
                                <View style={styles(colors).menuIcon}>
                                    <Icon
                                        name="barschart"
                                        size={24}
                                        color={colors.primary}
                                    />
                                </View>
                                <Text style={styles(colors).menuText}>
                                    Abstracts
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles(colors).menuItem}
                                onPress={() => {
                                    navigation.navigate("StaffAttendance");
                                }}>
                                <View style={styles(colors).menuIcon}>
                                    <Icon
                                        name="idcard"
                                        size={24}
                                        color={colors.primary}
                                    />
                                </View>
                                <Text style={styles(colors).menuText}>
                                    Staff Attendance
                                </Text>
                            </TouchableOpacity>
                        </React.Fragment>
                    )}
                </View>
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}>
                <View style={styles(colors).centeredView}>
                    <View style={styles(colors).modalView}>
                        <Text style={styles(colors).modalText}>
                            End Day Description
                        </Text>
                        <TextInput
                            style={styles(colors).input}
                            placeholder="Enter description"
                            value={description}
                            onChangeText={setDescription}
                        />
                        <View style={styles(colors).buttonGroup}>
                            <TouchableOpacity
                                style={[
                                    styles(colors).button,
                                    { backgroundColor: colors.accent },
                                ]}
                                onPress={handleEndDay}>
                                <Text style={styles(colors).buttonText}>
                                    Submit
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles(colors).button,
                                    {
                                        backgroundColor: colors.primary,
                                        marginLeft: 15,
                                    },
                                ]}
                                onPress={() => setModalVisible(false)}>
                                <Text style={styles(colors).buttonText}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            <View style={styles(colors).bottomBackground}>
                {/* Bottom background object */}
            </View>
        </View>
    );
};

export default HomeScreen;

const styles = colors =>
    StyleSheet.create({
        header: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: colors.primary,
            padding: 15,
            marginBottom: 20,
        },
        headerContent: {
            ...typography.h5(colors),
            color: colors.white,
        },
        statusCard: {
            backgroundColor: colors.white,
            borderRadius: 16,
            margin: 16,
            padding: 16,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 15,
            elevation: 2,
        },
        statusHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
        },
        statusTitle: {
            ...typography.body1(colors),
            fontWeight: "800",
            color: "#64748b",
        },
        statusRow: {
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
            marginBottom: 16,
        },
        statusItem: {
            flex: 1,
            alignItems: "center",
        },
        statusDivider: {
            width: 1,
            height: 40,
            backgroundColor: "#e2e8f0",
        },
        statusLabel: {
            ...typography.body2(colors),
            color: "#64748b",
            marginBottom: 4,
        },
        statusValue: {
            ...typography.body2(colors),
            fontWeight: "600",
            color: "#1e293b",
        },
        statusFooter: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f1f5f9",
            padding: 8,
            borderRadius: 8,
        },
        statusText: {
            color: "#2563eb",
            ...typography.body2(colors),
            fontWeight: "500",
            marginLeft: 8,
        },

        menuContainer: {
            flex: 1,
            padding: 16,
        },
        menuGrid: {
            flexWrap: "wrap",
            flexDirection: "row",
            justifyContent: "space-around",
            padding: 8,
        },
        menuItem: {
            aspectRatio: 1,
            width: "30%",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.white,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 15,
            elevation: 2,
        },
        menuIcon: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: "#eff6ff",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
        },
        menuText: {
            textAlign: "center",
            ...typography.body2(colors),
            fontWeight: "600",
            color: "#1e293b",
        },

        card: {
            padding: 16,
            backgroundColor: "#fff",
            borderRadius: 8,
            marginTop: 10,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
        },
        text: {
            fontSize: 16,
            marginBottom: 5,
        },
        label: {
            fontWeight: "bold",
        },
        card: {
            width: "90%",
            alignSelf: "center",
            backgroundColor: colors.background,
            padding: 20,
            borderRadius: 10,
            marginVertical: 8,
            shadowColor:
                colors.background === "#000000" ? colors.white : colors.black,
            shadowOffset: {
                width: 0,
                height: 1,
            },
            shadowOpacity: 0.22,
            shadowRadius: 2.22,
            elevation: 2,
        },
        cardTitle: {
            textAlign: "left",
            ...typography.h5(colors),
            fontWeight: "bold",
            marginBottom: 15,
        },
        timeContainer: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
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
            fontWeight: "bold",
        },
        timeText: {
            ...typography.body1(colors),
            color: colors.text,
        },
        webCard: {
            width: "90%",
            alignSelf: "center",
            flexDirection: "column",
            backgroundColor: colors.background,
            borderRadius: 10,
            elevation: 2,
            shadowColor:
                colors.background === "#000000" ? colors.white : colors.black,
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.22,
            shadowRadius: 2.22,
            padding: 15,
            marginVertical: 10,
        },
        webCardView: {
            flexDirection: "row",
            justifyContent: "space-between",
            flexWrap: "wrap",
            paddingHorizontal: 5,
        },
        iconView: {
            width: 100,
            height: 100,
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 0.75,
            borderRadius: 10,
            marginVertical: 10,
        },
        logo: {
            width: 35,
            height: 35,
        },
        text: {
            textAlign: "center",
            ...typography.body1(colors),
            color: colors.text,
            marginTop: 5,
        },
        centeredView: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
        },
        modalView: {
            margin: 20,
            backgroundColor: colors.secondary,
            borderRadius: 20,
            padding: 35,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
        },
        modalText: {
            marginBottom: 10,
            textAlign: "center",
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
            backgroundColor: colors.background,
        },
        buttonGroup: {
            flexDirection: "row",
            justifyContent: "flex-end",
            width: "100%",
            paddingHorizontal: 20,
        },
        bottomBackground: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "6%",
            backgroundColor: colors.primary,
            borderTopLeftRadius: 100,
        },
    });
