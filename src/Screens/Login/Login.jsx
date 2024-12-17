import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View } from "react-native";
import React, { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CryptoJS from "react-native-crypto-js";
import { typography } from "../../Constants/helper";
import { api } from "../../Constants/api";
import { useNavigation } from "@react-navigation/native";
import { useThemeContext } from "../../Context/ThemeContext";

const LoginScreen = () => {
    const { colors, customStyles } = useThemeContext();
    const navigation = useNavigation();

    const [isSubmitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        mobile: "",
        password: "",
    });

    const handleLogin = async () => {
        const { mobile, password } = form
        setSubmitting(true);

        const passHash =  CryptoJS.AES.encrypt(password, "ly4@&gr$vnh905RyB>?%#@-(KSMT").toString();

        try {
            const response = await fetch(api.login, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(
                    {
                        "username": mobile,
                        "password": passHash,
                    }
                ),
            });

            const data = await response.json()
            console.log(data)

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
            style={customStyles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <View style={styles(colors).topBackground}></View>
            <View style={styles(colors).bottomBackground}></View>

            <View style={styles(colors).formContainer}>
                <Text style={[typography.h1(colors), { fontStyle: "italic" }]}>Login</Text>
                <Text style={typography.body1(colors)}>Please sign in to continue.</Text>
                <TextInput
                    style={customStyles.input}
                    placeholder="Mobile Number"
                    placeholderTextColor={colors.textSecondary}
                    value={form.mobile}
                    autoCapitalize='none'
                    onChangeText={(value) => setForm({ ...form, mobile: value })}
                    keyboardType="default"
                />
                <TextInput
                    style={customStyles.input}
                    placeholder="Password"
                    placeholderTextColor={colors.textSecondary}
                    value={form.password}
                    onChangeText={(value) => setForm({ ...form, password: value })}
                    secureTextEntry
                    autoCapitalize='none'
                />

                <TouchableOpacity
                    style={[customStyles.button, { backgroundColor: colors.accent }]}
                    onPress={handleLogin}
                    disabled={isSubmitting}
                >
                    <Text style={customStyles.buttonText}>Login</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    )
}

export default LoginScreen

const styles = (colors) => StyleSheet.create({
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
});
