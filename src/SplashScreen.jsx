import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, ActivityIndicator } from 'react-native';
import { customColors, typography } from './Constants/helper';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SplashScreen = () => {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const colors = customColors[isDarkMode ? 'dark' : 'light'];
    const navigation = useNavigation();

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                await new Promise(resolve => setTimeout(resolve, 1000));

                setLoading(false);
                if (token !== null) {
                    navigation.replace('Home');
                } else {
                    navigation.replace('Login');
                }
            } catch (err) {
                console.log(err)
                setLoading(false);
            }
        })()
    }, [navigation]);

    return (
        <View style={styles(colors).container}>
            {loading && (
                <React.Fragment>
                    <Text style={styles(colors).title}>SMT ERP</Text>
                    <ActivityIndicator size="large" color={colors.white} style={styles(colors).loader} />
                </React.Fragment>
            )}
        </View>
    );
};

const styles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.primary
    },
    title: {
        ...typography.h1(colors),
        fontStyle: "italic",
        color: colors.white,
        marginBottom: 10
    },
    loader: {
        marginTop: 20,
    },
});

export default SplashScreen;
