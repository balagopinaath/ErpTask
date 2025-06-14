import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    ToastAndroid,
    TouchableOpacity,
    ActivityIndicator,
    View,
    FlatList,
    Modal,
} from "react-native";
import React, { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import CryptoJS from "react-native-crypto-js";
import Icon from "react-native-vector-icons/Feather";
import { api } from "../../Constants/api";
import { typography, customColors } from "../../Constants/helper";
import { useThemeContext } from "../../Context/ThemeContext";

const LoginScreen = () => {
    const { colors, customStyles } = useThemeContext();
    const navigation = useNavigation();

    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [step, setStep] = useState(1);
    const [modalVisible, setModalVisible] = useState(false);

    const [form, setForm] = useState({
        username: "",
        password: "",
    });
    const [isSubmitting, setSubmitting] = useState(false);

    const handleContinue = async () => {
        try {
            const response = await fetch(`${api.userPortal}${form.username}`);
            const jsonData = await response.json();

            if (jsonData.success && jsonData.data) {
                const companies = jsonData.data;
                setCompanies(companies);

                if (companies.length === 1) {
                    setSelectedCompany(companies[0]);
                    setStep(2);
                } else {
                    setStep(2);
                }
            } else {
                ToastAndroid.show(jsonData.message, ToastAndroid.LONG);
            }
        } catch (err) {
            console.log(err);
        }
    };

    const handleCompanySelect = company => {
        setSelectedCompany(company);
        setModalVisible(false);
    };

    const handleLogin = async () => {
        if (!selectedCompany) {
            ToastAndroid.show("Please select a company", ToastAndroid.LONG);
            return;
        }
        const { mobile, password } = form;
        setSubmitting(true);

        try {
            const passHash = CryptoJS.AES.encrypt(
                password,
                "ly4@&gr$vnh905RyB>?%#@-(KSMT",
            ).toString();

            const response = await fetch(api.userPortalLogin, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    Global_User_ID: selectedCompany.Global_User_ID,
                    username: mobile,
                    Password: passHash,

                    Company_Name: selectedCompany.Company_Name,
                    Global_Id: selectedCompany.Global_Id,
                    Local_Id: selectedCompany.Local_Id,
                    Web_Api: selectedCompany.Web_Api,
                }),
            });

            const data = await response.json();
            // console.log(data);

            if (data.success) {
                getUserAuth(data.data.Autheticate_Id);
            } else {
                ToastAndroid.show(data.message, ToastAndroid.LONG);
            }
        } catch (err) {
            console.log(err);
            ToastAndroid.show(err.message, ToastAndroid.LONG);
        } finally {
            setSubmitting(false);
        }
    };

    const getUserAuth = async userAuth => {
        try {
            const url = `${api.getUserAuthMob}`;
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `${userAuth}`,
                },
            });

            const data = await response.json();
            // console.log(data);

            if (data.success) {
                const authData = data.user;

                await AsyncStorage.setItem(
                    "userToken",
                    authData.Autheticate_Id,
                );
                await userData(authData);
                setForm({ username: "", password: "" });
                ToastAndroid.show(data.message, ToastAndroid.LONG);
                navigation.replace("Home");
            } else {
                ToastAndroid.show(data.message, ToastAndroid.LONG);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const userData = async data => {
        try {
            await AsyncStorage.multiSet([
                ["UserId", data.UserId],
                ["Company_Id", String(data.Company_id)],
                ["userName", data.UserName],
                ["Name", data.Name],
                ["UserType", data.UserType],
                ["branchId", String(data.BranchId)],
                ["branchName", data.BranchName],
                ["userType", data.UserType],
                ["userTypeId", data.UserTypeId],
            ]);
        } catch (e) {
            console.error("Error storing data: ", e);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles(colors).container}>
            <View style={styles(colors).topBackground} />

            <View style={styles(colors).formContainer}>
                <View style={styles(colors).loginContainer}>
                    <Text style={styles(colors).loginTitle}>
                        {step === 1 ? "Welcome" : "Login"}
                    </Text>
                    <Text style={styles(colors).loginSubtitle}>
                        {step === 1
                            ? "Enter your username to continue"
                            : "Complete your login details"}
                    </Text>
                </View>

                {step === 1 && (
                    <View style={{ width: "100%" }}>
                        <View style={styles(colors).inputContainer}>
                            <TextInput
                                style={styles(colors).input}
                                placeholder="Enter your username"
                                placeholderTextColor={colors.textSecondary}
                                value={form.username}
                                onChangeText={text =>
                                    setForm({ ...form, username: text })
                                }
                                autoCapitalize="none"
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleContinue}
                            style={styles(colors).button}>
                            <Text style={styles(colors).buttonText}>
                                Continue
                            </Text>
                            <Icon
                                name="arrow-right"
                                size={20}
                                color={colors.white}
                            />
                        </TouchableOpacity>
                    </View>
                )}

                {step === 2 && (
                    <View style={{ width: "100%" }}>
                        <View style={styles(colors).inputContainer}>
                            <Text style={styles(colors).input}>Username</Text>
                            <Text style={styles(colors).input}>
                                {form.username}
                            </Text>
                        </View>

                        {companies.length > 1 && (
                            <TouchableOpacity
                                onPress={() => setModalVisible(true)}
                                style={styles(colors).selectButton}>
                                <Text style={styles(colors).selectButtonText}>
                                    {selectedCompany
                                        ? selectedCompany.Company_Name
                                        : "Select your company"}
                                </Text>
                                <Icon
                                    name="chevron-down"
                                    size={20}
                                    color={colors.text}
                                />
                            </TouchableOpacity>
                        )}

                        {selectedCompany && (
                            <>
                                <View style={styles(colors).inputContainer}>
                                    <TextInput
                                        style={styles(colors).input}
                                        placeholder="Enter your password"
                                        placeholderTextColor={
                                            colors.textSecondary
                                        }
                                        value={form.password}
                                        onChangeText={text =>
                                            setForm({ ...form, password: text })
                                        }
                                        secureTextEntry
                                    />
                                </View>

                                <TouchableOpacity
                                    onPress={handleLogin}
                                    style={styles(colors).button}
                                    disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <ActivityIndicator
                                            color={colors.white}
                                        />
                                    ) : (
                                        <>
                                            <Text
                                                style={
                                                    styles(colors).buttonText
                                                }>
                                                Login
                                            </Text>
                                            <Icon
                                                name="log-in"
                                                size={20}
                                                color={colors.white}
                                            />
                                        </>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}>
                <View style={styles(colors).modalView}>
                    <View style={styles(colors).modalContainer}>
                        <View style={styles(colors).modalHeader}>
                            <Text style={styles(colors).modalSelectHeading}>
                                Select Company
                            </Text>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}>
                                <Icon name="x" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={companies}
                            keyExtractor={item => item.Global_Id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => handleCompanySelect(item)}
                                    style={styles(colors).item}>
                                    <Text style={styles(colors).itemText}>
                                        {item.Company_Name}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

export default LoginScreen;

const styles = colors =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        topBackground: {
            position: "absolute",
            top: 0,
            right: 0,
            width: "80%",
            height: "30%",
            backgroundColor: colors.primary,
            borderBottomLeftRadius: 100,
            opacity: 0.1,
        },
        formContainer: {
            flex: 1,
            padding: 24,
            justifyContent: "center",
        },
        loginContainer: {
            marginBottom: 40,
        },
        loginTitle: {
            ...typography.h1(colors),
            marginBottom: 8,
        },
        loginSubtitle: {
            ...typography.body1(colors),
        },
        inputContainer: {
            backgroundColor: colors.secondary,
            borderRadius: 12,
            marginBottom: 16,
            overflow: "hidden",
        },
        input: {
            paddingHorizontal: 20,
            paddingVertical: 16,
            fontSize: 16,
            color: colors.text,
        },
        button: {
            backgroundColor: colors.primary,
            borderRadius: 12,
            padding: 16,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
        },
        buttonText: {
            ...typography.button(colors),
            marginRight: 8,
        },
        selectButton: {
            backgroundColor: colors.secondary,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        selectButtonText: {
            ...typography.body1(colors),
        },
        modalView: {
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.5)",
        },
        modalContainer: {
            backgroundColor: colors.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            maxHeight: "80%",
        },
        modalHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
        },
        modalSelectHeading: {
            ...typography.h3(colors),
        },
        item: {
            padding: 16,
            borderRadius: 12,
            backgroundColor: colors.secondary,
            marginBottom: 8,
        },
        itemText: {
            ...typography.body1(colors),
        },
    });
