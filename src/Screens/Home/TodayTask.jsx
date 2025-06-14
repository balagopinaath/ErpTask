import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    FlatList,
} from "react-native";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/AntDesign";
import { useThemeContext } from "../../Context/ThemeContext";
import { typography } from "../../Constants/helper";
import { api } from "../../Constants/api";

const TodayTask = () => {
    const { colors, customStyles } = useThemeContext();
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const id = await AsyncStorage.getItem("UserId");
                const today = new Date().toISOString().split("T")[0];
                fetchTodayTask(id, today);
            } catch (err) {
                console.log("Error retrieving user data: ", err);
            }
        })();
    }, []);

    const fetchTodayTask = async (id, toDay) => {
        console.log(api.getTask(id, toDay));
        try {
            const response = await fetch(api.getTask(id, toDay));
            const data = await response.json();
            if (data.success && data.data && data.data.length > 0) {
                setTasks(data.data);
                setIsLoading(false);
            }
        } catch (error) {
            console.log("Error fetching data:", error);
            setIsLoading(false);
        }
    };

    const renderTaskItem = ({ item }) => {
        // Calculate schedule duration
        const scheduleDuration = `${item.Sch_Time} - ${item.EN_Time}`;

        // Determine status
        const status = item.Work_Status === null ? "Pending" : item.Work_Status;

        // Determine timer based
        const timerBased = item.Timer_Based === 0 ? "No" : "Yes";

        return (
            <TouchableOpacity
                style={styles(colors).taskContainer}
                onPress={() => {
                    /* Optional: Add task details navigation */
                }}>
                <View style={styles(colors).taskHeader}>
                    <Text style={styles(colors).taskName} numberOfLines={1}>
                        {item.Task_Name}
                    </Text>
                </View>

                <View style={styles(colors).taskDetails}>
                    <View style={styles(colors).detailRow}>
                        <Text style={styles(colors).detailLabel}>Project:</Text>
                        <Text style={styles(colors).detailValue}>
                            {item.Project_Name}
                        </Text>
                    </View>

                    <View style={styles(colors).detailRow}>
                        <Text style={styles(colors).detailLabel}>
                            Schedule:
                        </Text>
                        <Text style={styles(colors).detailValue}>
                            {scheduleDuration}
                        </Text>
                    </View>

                    <View style={styles(colors).detailRow}>
                        <Text style={styles(colors).detailLabel}>
                            Duration:
                        </Text>
                        <Text style={styles(colors).detailValue}>
                            {item.Sch_Period}
                        </Text>
                    </View>

                    <View style={styles(colors).detailRow}>
                        <Text style={styles(colors).detailLabel}>
                            Timer Based:
                        </Text>
                        <Text style={styles(colors).detailValue}>
                            {timerBased}
                        </Text>
                    </View>

                    <View style={styles(colors).detailRow}>
                        <Text style={styles(colors).detailLabel}>Status:</Text>
                        <Text
                            style={[
                                styles(colors).detailValue,
                                status === "Pending"
                                    ? styles(colors).pendingStatus
                                    : styles(colors).completedStatus,
                            ]}>
                            {status}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={customStyles.container}>
            {isLoading ? (
                <Text style={styles(colors).loadingText}>Loading tasks...</Text>
            ) : tasks.length > 0 ? (
                <FlatList
                    data={tasks}
                    renderItem={renderTaskItem}
                    keyExtractor={item => item.Id}
                    contentContainerStyle={styles(colors).listContainer}
                />
            ) : (
                <Text style={styles(colors).noTasksText}>
                    No tasks for today
                </Text>
            )}
        </View>
    );
};

export default TodayTask;

const styles = colors =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            height: "8%",
            justifyContent: "space-between",
            backgroundColor: colors.primary,
            padding: 15,
            marginBottom: 20,
        },
        headerContent: {
            ...typography.h5(colors),
            color: colors.white,
        },

        listContainer: {
            paddingHorizontal: 15,
            paddingVertical: 10,
        },
        taskContainer: {
            backgroundColor: colors.background,
            borderRadius: 10,
            marginBottom: 15,
            elevation: 3,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
        },
        taskHeader: {
            backgroundColor: colors.primary,
            padding: 12,
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
        },
        taskName: {
            color: colors.white,
            fontSize: 16,
            fontWeight: "bold",
        },
        taskDetails: {
            padding: 12,
        },
        detailRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 8,
        },
        detailLabel: {
            color: colors.text,
            fontSize: 14,
            fontWeight: "bold",
        },
        detailValue: {
            color: colors.textLight,
            fontSize: 14,
        },
        pendingStatus: {
            color: colors.warning,
        },
        completedStatus: {
            color: colors.success,
        },
        loadingText: {
            textAlign: "center",
            marginTop: 20,
            color: colors.textLight,
        },
        noTasksText: {
            textAlign: "center",
            marginTop: 20,
            color: colors.textLight,
            fontStyle: "italic",
        },
    });
