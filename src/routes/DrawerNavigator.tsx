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
import Icon from "react-native-vector-icons/Ionicons";
import SaleInvoice from "../Screens/Sales/SaleInvoice";
import AttendanceInfo from "../Screens/Home/AttendanceInfo";
import SaleOrder from "../Screens/Sales/SaleOrder";

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
                headerShown: false,
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
                    title: "Profile",
                    drawerLabel: "Profile",
                    drawerIcon: ({
                        color,
                        size,
                    }: {
                        color: string;
                        size: number;
                    }) => (
                        <Icon name="person-outline" size={size} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Attendance"
                component={AttendanceInfo}
                options={{
                    title: "Attendance",
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
            />

            <Drawer.Screen
                name="invoiceSale"
                component={SaleInvoice}
                options={{
                    title: "Sales Invoice",
                    drawerLabel: "Invoice Sale",
                    drawerIcon: ({
                        color,
                        size,
                    }: {
                        color: string;
                        size: number;
                    }) => (
                        <Icon
                            name="pricetag-outline"
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />

            <Drawer.Screen
                name="saleOrderInvoice"
                component={SaleOrder}
                options={{
                    title: "Sales Order",
                    drawerLabel: "Order Invoice",
                    drawerIcon: ({
                        color,
                        size,
                    }: {
                        color: string;
                        size: number;
                    }) => (
                        <Icon
                            name="pricetags-outline"
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
        </Drawer.Navigator>
    );
};

export default DrawerNavigator;
