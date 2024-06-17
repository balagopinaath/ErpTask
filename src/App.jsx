import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { customColors } from './Constants/helper';
import SplashScreen from './SplashScreen';
import HomeScreen from './Screens/Home/Home';
import LoginScreen from './Screens/Login/Login';
import WebViewScreen from './Screens/Home/WebViewScreen';

const Stack = createNativeStackNavigator();

const App = () => {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const colors = customColors[isDarkMode ? 'dark' : 'light'];

    return (
        <NavigationContainer>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.primary} />
            <SafeAreaView style={styles(colors).container}>
                <Stack.Navigator initialRouteName="Splash"
                    screenOptions={{
                        headerShown: false,
                    }}>
                    <Stack.Screen name="Splash" component={SplashScreen} />
                    <Stack.Screen name="Home" component={HomeScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="WebViewScreen" component={WebViewScreen} />
                </Stack.Navigator>
            </SafeAreaView>
        </NavigationContainer>
    );
};

export default App

const styles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    }
})