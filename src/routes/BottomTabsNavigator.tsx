import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Platform } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import Home from "../Screens/Home/Home";
import SettingScreen from "../Screens/Home/SettingScreen";
import AttendanceInfo from "../Screens/Home/AttendanceInfo";
import OpeningStock from "../Screens/Home/OpeningStock";
import { useTheme } from "../Context/ThemeContext";
import { BottomTabParamList } from "../Navigation/types";

const BottomTab = createBottomTabNavigator<BottomTabParamList>();

const BottomTabsNavigator = () => {
    const { colors, typography } = useTheme();

    return (
        <BottomTab.Navigator
            initialRouteName="Home"
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: colors.background,
                    borderTopColor: colors.borderColor,
                    borderTopWidth: 1,
                    height: Platform.OS === "ios" ? 90 : 60,
                    paddingBottom: Platform.OS === "ios" ? 20 : 5,
                    paddingTop: 5,
                },
                tabBarLabelStyle: {
                    ...typography.body1,
                    fontWeight: "600",
                },
            }}>
            <BottomTab.Screen
                name="Home"
                component={Home}
                options={{
                    title: "Home",
                    tabBarIcon: ({
                        color,
                        size,
                    }: {
                        color: string;
                        size: number;
                    }) => (
                        <Icon name="home-outline" size={size} color={color} />
                    ),
                }}
            />
            <BottomTab.Screen
                name="Stock"
                component={OpeningStock}
                options={{
                    title: "Stock",
                    tabBarIcon: ({
                        color,
                        size,
                    }: {
                        color: string;
                        size: number;
                    }) => (
                        <Icon
                            name="analytics-outline"
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
            <BottomTab.Screen
                name="Attendance"
                component={AttendanceInfo}
                options={{
                    title: "Attendance",
                    tabBarIcon: ({
                        color,
                        size,
                    }: {
                        color: string;
                        size: number;
                    }) => (
                        <Icon name="people-outline" size={size} color={color} />
                    ),
                }}
            />
            <BottomTab.Screen
                name="Settings"
                component={SettingScreen}
                options={{
                    title: "Settings",
                    tabBarIcon: ({
                        color,
                        size,
                    }: {
                        color: string;
                        size: number;
                    }) => (
                        <Icon
                            name="settings-outline"
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
        </BottomTab.Navigator>
    );
};

export default BottomTabsNavigator;
