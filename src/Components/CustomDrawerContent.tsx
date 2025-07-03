import React from "react";
import Icon from "react-native-vector-icons/Ionicons";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StatusBar,
    StyleSheet,
} from "react-native";
import {
    DrawerContentScrollView,
    DrawerItemList,
    DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { SafeAreaView } from "react-native-safe-area-context";
import { MMKV } from "react-native-mmkv";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../Navigation/types";
import { useTheme } from "../Context/ThemeContext";

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = props => {
    const { colors, typography, mode } = useTheme();
    const styles = getStyles(typography, colors);
    const storage = new MMKV();
    const navigation =
        useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const pkg = require("../../package.json");
    const appVersion = pkg.version || "1.0.0";

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar
                barStyle={mode === "light" ? "light-content" : "dark-content"}
                backgroundColor={colors.primary}
            />
            <DrawerContentScrollView
                {...props}
                contentContainerStyle={styles.scrollView}>
                <View
                    style={[
                        styles.header,
                        { backgroundColor: colors.primary },
                    ]}>
                    <Image
                        source={require("../../assets/images/logo.png")}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={[styles.appName, { color: colors.white }]}>
                        Pukal Melanmai
                    </Text>
                    <Text style={[styles.version, { color: colors.white }]}>
                        Version {appVersion}
                    </Text>
                </View>

                {/* Menu Items */}
                <View style={styles.menuContainer}>
                    <DrawerItemList {...props} />
                </View>
            </DrawerContentScrollView>

            {/* Footer Section */}
            <View
                style={[styles.footer, { borderTopColor: colors.borderColor }]}>
                <TouchableOpacity
                    style={[
                        styles.logoutButton,
                        { backgroundColor: colors.accent },
                    ]}
                    onPress={() => {
                        storage.clearAll();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: "Login" }],
                        });
                    }}>
                    <Icon
                        name="log-out-outline"
                        size={20}
                        color={colors.white}
                    />
                    <Text style={[styles.logoutText, { color: colors.white }]}>
                        Logout
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const getStyles = (typography: any, colors: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
        },
        scrollView: {
            flexGrow: 1,
        },
        header: {
            paddingVertical: 30,
            paddingHorizontal: 20,
            alignItems: "center",
            marginBottom: 10,
        },
        logo: {
            width: 60,
            height: 60,
            marginBottom: 10,
        },
        appName: {
            ...typography.h4,
            fontWeight: "bold",
            marginBottom: 5,
        },
        version: {
            ...typography.body2,
            color: colors.textSecondary,
            opacity: 0.8,
        },
        menuContainer: {
            flex: 1,
            paddingTop: 10,
        },
        footer: {
            borderTopWidth: 1,
            padding: 20,
        },
        logoutButton: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 8,
        },
        logoutText: {
            marginLeft: 10,
            ...typography.body1,
            color: colors.white,
            fontWeight: "600",
        },
    });

export default CustomDrawerContent;
