import { StatusBar } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import React from "react";

import { RootStackParamList } from "./types";
import { useTheme } from "../Context/ThemeContext";

import SplashScreen from "../SplashScreen";
import DrawerNavigator from "../routes/DrawerNavigator";

import LoginScreen from "../Screens/Login/Login";
import CompanySwitch from "../Screens/Login/CompanySwitch";
import SettingScreen from "../Screens/Home/SettingScreen";
import ProfileScreen from "../Screens/Home/ProfileScreen";

import SaleOrder from "../Screens/Sales/SaleOrder";
import SaleInvoice from "../Screens/Sales/SaleInvoice";
import PurchaseOrder from "../Screens/Purchase/PurchaseOrder";

import OpeningStockItemWise from "../Screens/Home/OpeningStockItemWise";
import OpeningStockGodownWise from "../Screens/Home/OpeningStockGodownWise";

import ReceiptList from "../Screens/Receipts/ReceiptList";
import PaymentList from "../Screens/Payment/PaymentList";
import Transaction from "../Screens/Payment/Transaction";
import TransactionList from "../Screens/Payment/TransactionList";
import Expenses from "../Screens/Payment/Expenses";

import DeliveryPending from "../Screens/Sales/DeliveryPending";
import SalesPendingOrderWise from "../Screens/Sales/SalesPendingOrderWise";
import SalesPendingItemWise from "../Screens/Sales/SalesPendingItemWise";
import Debtors from "../Screens/Payment/Debtors";
import TransactionListExpenses from "../Screens/Payment/TransactionListExpenses";
import ItemWiseTransaction from "../Screens/Home/ItemWiseTransaction";
import GodownItemWiseTransaction from "../Screens/Home/GodownitemTransaction";
import GraphicalAnalysisReport from "../Screens/Home/GraphAnalyticsReport";
import ShetSheet from "../ShetSheet/ShetSheet";
import ShetSheetDetail from "../ShetSheet/ShetSheetDetail";


import ItemStack from "../Screens/Reports/ItemStack";
import GodownItemWise from "../Screens/Reports/GodownItemWise";
import DeliveryFunnel from "../Screens/Reports/DeliveryFunnel"
import Ratemaster from "../Screens/Reports/Ratemaster";
import RateMasterAdmin from "../Screens/Reports/RateMasterAdmin";

// Not used



const Stack = createNativeStackNavigator<RootStackParamList>();

const Navigation = () => {
    const { colors, mode } = useTheme();

    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <StatusBar
                    barStyle={
                        mode === "light" ? "light-content" : "dark-content"
                    }
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
                    <Stack.Screen
                        name="CompanySwitch"
                        component={CompanySwitch}
                    />

                    <Stack.Screen
                        name="saleOrderInvoice"
                        component={SaleOrder}
                    />
                    <Stack.Screen name="invoiceSale" component={SaleInvoice} />
                    <Stack.Screen
                        name="purchaseOrder"
                        component={PurchaseOrder}
                    />
                    
                    <Stack.Screen
                        name="Stockitem"
                        component={OpeningStockItemWise}
                    />

                    <Stack.Screen
                        name="Stockgodown"
                        component={OpeningStockGodownWise}
                    />

                    <Stack.Screen
                        name="receiptList"
                        component={ReceiptList}
                    />

                    <Stack.Screen
                        name="paymentList"
                        component={PaymentList}
                    />
                    
                    <Stack.Screen
                        name="deliveryPend"
                        component={DeliveryPending}
                    />
                    <Stack.Screen
                        name="saleorderpendorder"
                        component={SalesPendingOrderWise}
                    />
                    <Stack.Screen 
                        name="saleorderpenditem"
                        component={SalesPendingItemWise}
                    />
                    
                    <Stack.Screen
                        name="transaction"
                        component={Transaction}
                    />
                    <Stack.Screen
                        name="transactionlist"
                        component={TransactionList}
                    />
                    <Stack.Screen
                        name="debtors"
                        component={Debtors}
                    />
                    <Stack.Screen
                        name="expenses"
                        component={Expenses}
                    />
                    <Stack.Screen
                        name="transactionlistexp"
                        component={TransactionListExpenses}
                    />
                    <Stack.Screen
                        name="transactionlistitem"
                        component={ItemWiseTransaction}
                    />
                    <Stack.Screen
                        name="transactionlistgodownitem"
                        component={GodownItemWiseTransaction}
                    />
                    <Stack.Screen 
                        name="graphicalanalysis"
                        component={GraphicalAnalysisReport}
                    />

                    <Stack.Screen name="ShetSheet" component={ShetSheet} />
                    <Stack.Screen name="ShetSheetDetail" component={ShetSheetDetail} />

                    <Stack.Screen
                        name="ItemStack"
                        component={ItemStack}
                    />

                    <Stack.Screen
                        name="GodownItemWise"
                        component={GodownItemWise}
                    />

                    <Stack.Screen
                        name="DeliveryFunnel"
                        component={DeliveryFunnel}
                    />

                    <Stack.Screen
                        name="Ratemaster"
                        component={Ratemaster}
                    />

                    <Stack.Screen
                        name="RatemasterAdmin"
                        component={RateMasterAdmin}
                    />

                    {/* Not used */}
                    
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
};

export default Navigation;
