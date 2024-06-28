import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { typography } from './Constants/helper';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeContext } from './Context/ThemeContext';

const SplashScreen = () => {
    const { colors, customStyles } = useThemeContext();
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
                    <Image source={require('../assets/images/logo.png')} style={styles(colors).logo} />
                    {/* <Text style={styles(colors).title}>SMT ERP</Text> */}
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
    logo: {
        width: 100,
        height: 100,
        marginBottom: 20
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
