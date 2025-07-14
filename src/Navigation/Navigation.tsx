import { StatusBar } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import { useTheme } from "../Context/ThemeContext";

import SplashScreen from "../SplashScreen";
import LoginScreen from "../Screens/Login/Login";
import DrawerNavigator from "../routes/DrawerNavigator";
import { RootStackParamList } from "./types";
import SettingScreen from "../Screens/Home/SettingScreen";
import ProfileScreen from "../Screens/Home/ProfileScreen";
import SaleInvoice from "../Screens/Sales/SaleInvoice";
import SaleOrder from "../Screens/Sales/SaleOrder";
import PurchaseInvoice from "../Screens/Purchase/PurchaseInvoice";
import PurchaseOrder from "../Screens/Purchase/PurchaseOrder";
import ItemStack from "../Screens/Stack/ItemStack";

const Stack = createNativeStackNavigator<RootStackParamList>();

const Navigation = () => {
    const { colors, mode } = useTheme();

    return (
        <NavigationContainer>
            <StatusBar
                barStyle={mode === "light" ? "light-content" : "dark-content"}
                backgroundColor={colors.primary}
            />
            <Stack.Navigator
                initialRouteName="Splash"
                screenOptions={{
                    headerShown: false,
                    gestureEnabled: true,
                }}>
                <Stack.Screen
                    name="Splash"
                    component={SplashScreen}
                    options={{
                        animationTypeForReplace: "push",
                    }}
                />

                <Stack.Screen
                    name="MainDrawer"
                    component={DrawerNavigator}
                    options={{
                        gestureEnabled: false,
                    }}
                />

                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="setting" component={SettingScreen} />
                <Stack.Screen name="profile" component={ProfileScreen} />

                <Stack.Screen name="invoiceSale" component={SaleInvoice} />
                <Stack.Screen name="saleOrderInvoice" component={SaleOrder} />

                <Stack.Screen
                    name="purchaseInvoice"
                    component={PurchaseInvoice}
                />
                <Stack.Screen name="purchaseOrder" component={PurchaseOrder} />
                <Stack.Screen name="ItemStack" component={ItemStack} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default Navigation;
