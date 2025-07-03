import React from "react";
import {
    createDrawerNavigator,
    DrawerContentComponentProps,
} from "@react-navigation/drawer";
import BottomTabsNavigator from "./BottomTabsNavigator";
import { useTheme } from "../Context/ThemeContext";
import { DrawerParamList } from "../Navigation/types";
import ProfileScreen from "../Screens/Home/ProfileScreen";
import CustomDrawerContent from "../Components/CustomDrawerContent";

const Drawer = createDrawerNavigator<DrawerParamList>();

const DrawerNavigator = () => {
    const { colors, typography } = useTheme();

    return (
        <Drawer.Navigator
            initialRouteName="HomeTab"
            drawerContent={(props: DrawerContentComponentProps) => (
                <CustomDrawerContent {...props} />
            )}
            screenOptions={{
                headerShown: true,
                drawerStyle: {
                    backgroundColor: colors.background,
                    width: 280,
                    marginTop: -10,
                },
                drawerActiveTintColor: colors.primary,
                drawerInactiveTintColor: colors.textSecondary,
                headerStyle: {
                    backgroundColor: colors.primary,
                },
                headerTintColor: colors.white,
                drawerLabelStyle: {
                    ...typography.body1,
                    fontWeight: "500",
                },
            }}>
            <Drawer.Screen
                name="HomeTab"
                component={BottomTabsNavigator}
                options={{
                    headerShown: false,
                    title: "Home",
                    drawerLabel: "Home",
                }}
            />
            <Drawer.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    headerShown: false,
                }}
            />
            {/* <Drawer.Screen
                name="TodayTask"
                component={TodayTask}
                options={{
                    headerShown: false,
                }}
            />
            <Drawer.Screen
                name="AttendanceInfo"
                component={AttendanceInfo}
                options={{
                    title: "Attendance Info",
                    drawerLabel: "Attendance",
                    drawerIcon: ({
                        color,
                        size,
                    }: {
                        color: string;
                        size: number;
                    }) => (
                        <Icon name="people-outline" size={size} color={color} />
                    ),
                }}
            /> */}
        </Drawer.Navigator>
    );
};

export default DrawerNavigator;
