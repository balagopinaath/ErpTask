import { StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View, useColorScheme } from 'react-native'
import React, { useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { customColors, typography } from '../../Constants/helper';
import { api } from '../../Constants/api';
import { useNavigation } from '@react-navigation/native';

const LoginScreen = () => {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const colors = customColors[isDarkMode ? 'dark' : 'light'];
    const navigation = useNavigation();

    const [isSubmitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        mobile: "",
        password: "",
    });

    const handleLogin = async () => {
        const { mobile, password } = form
        setSubmitting(true);

        try {
            const response = await fetch(api.login, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(
                    {
                        "username": mobile,
                        "password": password,
                    }
                ),
            });

            const data = await response.json()

            if (data.success) {
                await AsyncStorage.setItem('userToken', data.user.Autheticate_Id);
                userData(data.user);
                // setForm({ mobile: '', password: '' });
                // setIsLogged(true)
                ToastAndroid.show(data.message, ToastAndroid.LONG);
                navigation.replace("Home")
            } else {
                ToastAndroid.show(data.message, ToastAndroid.LONG);
            }
        } catch (err) {
            console.log(err)
            ToastAndroid.show(err.message, ToastAndroid.LONG);
        } finally {
            setSubmitting(false);
        }
    };

    const userData = async (data) => {
        try {
            console.log('userdata', data)
            await AsyncStorage.setItem('userToken', data.Autheticate_Id);
            await AsyncStorage.setItem('UserId', data.UserId);
            await AsyncStorage.setItem('Company_Id', String(data.Company_id));
            await AsyncStorage.setItem('userName', data.UserName);
            await AsyncStorage.setItem('Name', data.Name);
            await AsyncStorage.setItem('UserType', data.UserType);
            await AsyncStorage.setItem('branchId', String(data.BranchId));
            await AsyncStorage.setItem('branchName', data.BranchName);
            await AsyncStorage.setItem('userType', data.UserType);
            await AsyncStorage.setItem('userTypeId', data.UserTypeId);
        } catch (e) {
            console.error('Error storing data:', e);
        }
    };


    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.topBackground}>
                {/* Top background object */}
            </View>
            <View style={styles.bottomBackground}>
                {/* Bottom background object */}
            </View>
            <View style={styles.formContainer}>
                <Text style={typography.h1(colors)}>Login</Text>
                <Text style={typography.body1(colors)}>Please sign in to continue.</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.secondary }]}
                    placeholder="Mobile Number"
                    placeholderTextColor={colors.textSecondary}
                    value={form.mobile}
                    onChangeText={(value) => setForm({ ...form, mobile: value })}
                    keyboardType="default"
                />
                <TextInput
                    style={[styles.input, { backgroundColor: colors.secondary }]}
                    placeholder="Password"
                    placeholderTextColor={colors.textSecondary}
                    value={form.password}
                    onChangeText={(value) => setForm({ ...form, password: value })}
                    secureTextEntry
                />

                <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default LoginScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    topBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: "15%",
        backgroundColor: '#20cb98',
        borderBottomRightRadius: 750,
    },
    bottomBackground: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: "15%",
        backgroundColor: '#20cb98',
        borderTopLeftRadius: 750,
    },
    formContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 35,
    },
    input: {
        height: 50,
        borderRadius: 10,
        paddingHorizontal: 15,
        marginVertical: 10,
        width: '100%',
    },
    button: {
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10,
        width: '100%',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    forgotText: {
        alignSelf: 'flex-end',
        color: '#FF6347', // Adjust color as needed
    },
    signUpText: {
        alignSelf: 'center',
        marginTop: 20,
        color: '#A9A9A9', // Adjust color as needed
    },
});
