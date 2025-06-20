import { StatusBar } from "react-native";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemeContext } from "../Context/ThemeContext";
import { typography } from "../Constants/helper";

import SplashScreen from "../SplashScreen";
import HomeScreen from "../Screens/Home/Home";
import WebViewScreen from "../Screens/Home/WebViewScreen";
import DriverActivities from "../Activities/DriverActivities";
import GodownActivities from "../Activities/GodownActivities";
import InwardsActivities from "../Activities/InwardsActivities";
import StaffActivities from "../Activities/StaffActivities";
import DeliveryActivities from "../Activities/DeliveryActivities";
import LoginScreen from "../Screens/Login/Login";
import WCActivities from "../Activities/WCActivities";
import OverAllAbstract from "../Activities/OverAllAbstract";
import StaffAttendance from "../Activities/StaffAttendance";
import TodayTask from "../Screens/Home/TodayTask";
import AttendanceInfo from "../Screens/attendance/AttendanceInfo";

const Stack = createNativeStackNavigator();

const Navigation = () => {
    const { colors, isDarkMode, customStyles } = useThemeContext();

    return (
        <NavigationContainer>
            <StatusBar
                barStyle={isDarkMode ? "dark-content" : "light-content"}
                backgroundColor={colors.primary}
            />
            <SafeAreaView style={customStyles.container}>
                <Stack.Navigator
                    initialRouteName="Splash"
                    screenOptions={{
                        headerShown: false,
                    }}>
                    <Stack.Screen name="Splash" component={SplashScreen} />
                    <Stack.Screen name="Home" component={HomeScreen} />
                    <Stack.Screen
                        name="TodayTask"
                        component={TodayTask}
                        options={getScreenOption(colors, "Today's Task")}
                    />
                    <Stack.Screen
                        name="AttendanceInfo"
                        component={AttendanceInfo}
                        options={getScreenOption(colors, "Attendance Info")}
                    />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen
                        name="WebViewScreen"
                        component={WebViewScreen}
                    />

                    <Stack.Screen
                        name="GodownActivities"
                        component={GodownActivities}
                        options={getScreenOption(colors, "Godown Activities")}
                    />

                    <Stack.Screen
                        name="DriverActivities"
                        component={DriverActivities}
                        options={getScreenOption(colors, "Drivers Activities")}
                    />

                    <Stack.Screen
                        name="DeliveryActivities"
                        component={DeliveryActivities}
                        options={getScreenOption(colors, "Delivery Activities")}
                    />

                    <Stack.Screen
                        name="StaffActivities"
                        component={StaffActivities}
                        options={getScreenOption(colors, "Staff Activities")}
                    />

                    <Stack.Screen
                        name="InwardsActivities"
                        component={InwardsActivities}
                        options={getScreenOption(colors, "Inwards Activities")}
                    />

                    <Stack.Screen
                        name="WCActivities"
                        component={WCActivities}
                        options={getScreenOption(
                            colors,
                            "Weight Check Activities",
                        )}
                    />

                    <Stack.Screen
                        name="OverAllAbstract"
                        component={OverAllAbstract}
                        options={getScreenOption(colors, "Abstracts")}
                    />

                    <Stack.Screen
                        name="StaffAttendance"
                        component={StaffAttendance}
                        options={getScreenOption(colors, "Staff Attendance")}
                    />
                </Stack.Navigator>
            </SafeAreaView>
        </NavigationContainer>
    );
};

const getScreenOption = (colors, title) => ({
    title,
    headerShown: true,
    headerBlurEffect: true,
    headerStyle: {
        backgroundColor: colors.primary,
    },
    headerTintColor: colors.white,
    headerTitleStyle: {
        ...typography.h5(colors),
        fontWeight: "600",
        color: colors.white,
    },
});

export default Navigation;
