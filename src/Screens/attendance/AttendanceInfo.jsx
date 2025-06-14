import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Feather";
import { api } from "../../Constants/api";

const AttendanceInfo = () => {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const id = await AsyncStorage.getItem("UserId");
                const today = new Date().toISOString().split("T")[0];
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayDate = yesterday.toISOString().split("T")[0];
                fetchTodayAttendance(yesterdayDate, yesterdayDate, id);
            } catch (err) {
                console.log("Error retrieving user data: ", err);
            }
        })();
    }, []);

    const fetchTodayAttendance = async (fromDate, toDate, userId) => {
        try {
            const url = api.trackActivitylogAttendance(
                fromDate,
                toDate,
                userId,
            );
            // console.log(url);

            const response = await fetch(url);
            const data = await response.json();
            if (data.success && data.data && data.data.length > 0) {
                setData(data.data);
            }
            setIsLoading(false);
        } catch (error) {
            console.log("Error fetching data:", error);
            setIsLoading(false);
        }
    };

    const parseAttendanceDetails = details => {
        return details
            .split(", ")
            .map(detail => {
                const [date, time, punchType] = detail.split(" ");

                // Extract punch number from the format (1), (2), etc.
                const punchNumber = punchType.replace(/[()]/g, "");

                // Determine if it's In or Out based on punch number
                // Assuming odd numbers (1,3) are In and even numbers (2,4) are Out
                const type = parseInt(punchNumber) % 2 === 1 ? "In" : "Out";

                // Parse the time properly
                const [hours, minutes, seconds] = time.split(":");

                // Create a date object for time conversion
                const timeObj = new Date();
                timeObj.setHours(parseInt(hours));
                timeObj.setMinutes(parseInt(minutes));

                // Convert to 12-hour format
                const timeIn12Hour = timeObj.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "numeric",
                    hour12: true,
                });

                return { date, time: timeIn12Hour, type };
            })
            .reverse(); // Show chronologically
    };

    const isPresent = details => {
        const punchTimes = parseAttendanceDetails(details);
        return punchTimes.some(punch => punch.type === "In");
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0066cc" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {data.map(record => (
                <View key={record.User_Mgt_Id} style={styles.card}>
                    {/* Header Section */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.username}>
                                {record.username}
                            </Text>
                            <Text style={styles.designation}>
                                {record.Designation_Name}
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.statusContainer,
                                isPresent(record.AttendanceDetails)
                                    ? styles.presentStatus
                                    : styles.absentStatus,
                            ]}>
                            <Icon
                                name={
                                    isPresent(record.AttendanceDetails)
                                        ? "user-check"
                                        : "alert-circle"
                                }
                                size={16}
                                color={
                                    isPresent(record.AttendanceDetails)
                                        ? "#16a34a"
                                        : "#ca8a04"
                                }
                                style={styles.statusIcon}
                            />
                            <Text
                                style={[
                                    styles.statusText,
                                    isPresent(record.AttendanceDetails)
                                        ? styles.presentText
                                        : styles.absentText,
                                ]}>
                                {isPresent(record.AttendanceDetails)
                                    ? "Present"
                                    : "Not Present"}
                            </Text>
                        </View>
                    </View>

                    {/* Punch Times Section */}
                    <View style={styles.punchContainer}>
                        {parseAttendanceDetails(record.AttendanceDetails).map(
                            (punch, index) => (
                                <View key={index} style={styles.punchRow}>
                                    <View style={styles.timeContainer}>
                                        <Icon
                                            name="clock"
                                            size={16}
                                            color="#6b7280"
                                            style={styles.clockIcon}
                                        />
                                        <Text style={styles.timeText}>
                                            {punch.time}
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.punchType,
                                            punch.type === "In"
                                                ? styles.inPunch
                                                : styles.outPunch,
                                        ]}>
                                        <Text
                                            style={[
                                                styles.punchTypeText,
                                                punch.type === "In"
                                                    ? styles.inPunchText
                                                    : styles.outPunchText,
                                            ]}>
                                            {punch.type}
                                        </Text>
                                    </View>
                                </View>
                            ),
                        )}
                    </View>

                    {/* Total Count Section */}
                    <View style={styles.totalContainer}>
                        <Text style={styles.totalText}>
                            Total Punches: {record.record_count}
                        </Text>
                    </View>
                </View>
            ))}
        </ScrollView>
    );
};

export default AttendanceInfo;

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#f5f5f5",
    },
    card: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    username: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1f2937",
    },
    designation: {
        fontSize: 14,
        color: "#6b7280",
        marginTop: 2,
    },
    statusContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    presentStatus: {
        backgroundColor: "#dcfce7",
    },
    absentStatus: {
        backgroundColor: "#fef9c3",
    },
    statusIcon: {
        marginRight: 4,
    },
    statusText: {
        fontSize: 14,
        fontWeight: "600",
    },
    presentText: {
        color: "#16a34a",
    },
    absentText: {
        color: "#ca8a04",
    },
    punchContainer: {
        marginBottom: 16,
    },
    punchRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#f9fafb",
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    timeContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    clockIcon: {
        marginRight: 8,
    },
    timeText: {
        fontSize: 15,
        fontWeight: "500",
        color: "#374151",
    },
    punchType: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    inPunch: {
        backgroundColor: "#dcfce7",
    },
    outPunch: {
        backgroundColor: "#fee2e2",
    },
    punchTypeText: {
        fontSize: 13,
        fontWeight: "600",
    },
    inPunchText: {
        color: "#16a34a",
    },
    outPunchText: {
        color: "#dc2626",
    },
    totalContainer: {
        backgroundColor: "#f3f4f6",
        padding: 12,
        borderRadius: 8,
    },
    totalText: {
        fontSize: 14,
        color: "#4b5563",
        fontWeight: "500",
    },
});
