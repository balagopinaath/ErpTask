import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View, useColorScheme } from 'react-native'
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
                await userData(data.user);
                // setForm({ mobile: '', password: '' });
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
            await AsyncStorage.multiSet([
                ['UserId', data.UserId],
                ['Company_Id', String(data.Company_id)],
                ['userName', data.UserName],
                ['Name', data.Name],
                ['UserType', data.UserType],
                ['branchId', String(data.BranchId)],
                ['branchName', data.BranchName],
                ['userType', data.UserType],
                ['userTypeId', data.UserTypeId]
            ]);
        } catch (e) {
            console.error('Error storing data:', e);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={[styles(colors).container, { backgroundColor: colors.background }]}>
                <View style={styles(colors).topBackground}>
                    {/* Top background object */}
                </View>
                <View style={styles(colors).bottomBackground}>
                    {/* Bottom background object */}
                </View>
                <View style={styles(colors).formContainer}>
                    <Text style={[typography.h1(colors), { fontStyle: 'italic' }]}>Login</Text>
                    <Text style={typography.body1(colors)}>Please sign in to continue.</Text>
                    <TextInput
                        style={[styles(colors).input, { backgroundColor: colors.secondary }]}
                        placeholder="Mobile Number"
                        placeholderTextColor={colors.textSecondary}
                        value={form.mobile}
                        autoCapitalize='none'
                        onChangeText={(value) => setForm({ ...form, mobile: value })}
                        keyboardType="default"
                    />
                    <TextInput
                        style={[styles(colors).input, { backgroundColor: colors.secondary }]}
                        placeholder="Password"
                        placeholderTextColor={colors.textSecondary}
                        value={form.password}
                        onChangeText={(value) => setForm({ ...form, password: value })}
                        secureTextEntry
                        autoCapitalize='none'
                    />

                    <TouchableOpacity
                        style={[styles(colors).button, { backgroundColor: colors.accent }]}
                        onPress={handleLogin}
                        disabled={isSubmitting}
                    >
                        <Text style={styles(colors).buttonText}>Login</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    )
}

export default LoginScreen

const styles = (colors) => StyleSheet.create({
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
        backgroundColor: colors.primary,
        borderBottomRightRadius: 750,
    },
    bottomBackground: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: "15%",
        backgroundColor: colors.primary,
        borderTopLeftRadius: 750,
    },
    formContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 35,
    },
    input: {
        ...typography.body1(colors),
        height: 50,
        borderRadius: 10,
        paddingHorizontal: 15,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: '#A9A9A9',
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
        ...typography.button(colors),
        fontWeight: 'bold',
    },
});
