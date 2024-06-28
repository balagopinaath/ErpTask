import { StatusBar } from 'react-native';
import React from 'react';

import { useThemeContext } from '../Context/ThemeContext';
import { typography } from '../Constants/helper';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import SplashScreen from '../SplashScreen'
import HomeScreen from '../Screens/Home/Home'
import WebViewScreen from '../Screens/Home/WebViewScreen';
import DriverActivities from '../Activities/DriverActivities';
import GodownActivities from '../Activities/GodownActivities';
import InwardsActivities from '../Activities/InwardsActivities';
import StaffActivities from '../Activities/StaffActivities';
import DeliveryActivities from '../Activities/DeliveryActivities';
import LoginScreen from '../Screens/Login/Login';

const Stack = createNativeStackNavigator();

const Navigation = () => {
    const { colors, isDarkMode, customStyles } = useThemeContext()

    return (
        <NavigationContainer>
            <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={colors.primary}
            />
            <SafeAreaView style={customStyles.container}>
                <Stack.Navigator initialRouteName="Splash"
                    screenOptions={{
                        headerShown: false,
                    }}>
                    <Stack.Screen name="Splash" component={SplashScreen} />
                    <Stack.Screen name="Home" component={HomeScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="WebViewScreen" component={WebViewScreen} />

                    <Stack.Screen name="GodownActivities"
                        component={GodownActivities}
                        options={getScreenOption(colors, "Godown Activities")}
                    />

                    <Stack.Screen name="DriverActivities"
                        component={DriverActivities}
                        options={getScreenOption(colors, "Drivers Activities")}
                    />

                    <Stack.Screen name="DeliveryActivities"
                        component={DeliveryActivities}
                        options={getScreenOption(colors, "Delivery Activities")}
                    />

                    <Stack.Screen name="StaffActivities"
                        component={StaffActivities}
                        options={getScreenOption(colors, "Staff Activities")}
                    />

                    <Stack.Screen name="InwardsActivities"
                        component={InwardsActivities}
                        options={getScreenOption(colors, "Inwards Activities")}
                    />

                </Stack.Navigator>
            </SafeAreaView>
        </NavigationContainer>
    )
}

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
        fontWeight: '600',
        color: colors.white,
    }
})

export default Navigation