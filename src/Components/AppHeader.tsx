import React, { FC } from "react";
import {
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Platform,
} from "react-native";
import AntDesign from "react-native-vector-icons/AntDesign";
import FeatherIcon from "react-native-vector-icons/Feather";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../Context/ThemeContext";
import { responsiveHeight, responsiveWidth } from "../constants/helper";

const iconLibraries = {
    MaterialIcon: MaterialIcon,
    FontAwesome: FontAwesome,
    AntDesign: AntDesign,
    MaterialCommunityIcons: MaterialCommunityIcons,
    FeatherIcon: FeatherIcon,
} as const;

type AppHeaderProps = {
    title?: string;
    navigation: any;
    showRightIcon?: boolean;
    rightIconName?: string;
    rightIconLibrary?: keyof typeof iconLibraries;
    onRightPress?: () => void;
    showBack?: boolean;
    showDrawer?: boolean;
    subtitle?: string;
    name?: string;
};

const AppHeader: FC<AppHeaderProps> = ({
    title = "",
    navigation,
    showRightIcon = false,
    rightIconName = "",
    rightIconLibrary = "MaterialIcon",
    onRightPress = () => {},
    showBack = true,
    showDrawer = false,
    subtitle = "",
    name = "",
}) => {
    const { colors, typography, mode } = useTheme();
    const styles = getStyles(typography, colors);

    const RightIcon =
        iconLibraries[rightIconLibrary as keyof typeof iconLibraries];

    return (
        <View style={styles.headerContainer}>
            <StatusBar
                backgroundColor={colors.primary}
                barStyle={mode === "light" ? "light-content" : "dark-content"}
                translucent={false}
            />
            <View style={styles.headerContent}>
                {showDrawer ? (
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => navigation.openDrawer()}
                        activeOpacity={0.7}>
                        <FontAwesome
                            name="bars"
                            size={22}
                            color={colors.white}
                        />
                    </TouchableOpacity>
                ) : showBack ? (
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}>
                        <MaterialIcon
                            name="arrow-back"
                            size={22}
                            color={colors.white}
                        />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.placeholder} />
                )}

                <View style={styles.titleContainer}>
                    {name ? (
                        <View style={styles.welcomeContainer}>
                            <Text style={styles.welcomeText} numberOfLines={1}>
                                Welcome,{" "}
                                <Text style={styles.nameText}>{name}!</Text>
                            </Text>
                            {subtitle && (
                                <Text
                                    style={styles.subtitleText}
                                    numberOfLines={1}>
                                    {subtitle}
                                </Text>
                            )}
                        </View>
                    ) : (
                        <Text
                            style={styles.headerText}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.8}>
                            {title}
                        </Text>
                    )}
                </View>

                {showRightIcon && RightIcon && rightIconName ? (
                    <TouchableOpacity
                        onPress={onRightPress}
                        style={styles.iconButton}
                        activeOpacity={0.7}>
                        <RightIcon
                            name={rightIconName}
                            size={22}
                            color={colors.white}
                        />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.placeholder} />
                )}
            </View>
        </View>
    );
};

export default AppHeader;

const getStyles = (typography: any, colors: any) =>
    StyleSheet.create({
        headerContainer: {
            backgroundColor: colors.primary,
            shadowColor: Platform.OS === "ios" ? colors.black : colors.grey,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 8,
            borderBottomWidth: Platform.OS === "android" ? 0.5 : 0,
            borderBottomColor: colors.borderColor,
        },
        headerContent: {
            width: "100%",
            minHeight: responsiveHeight(8),
            maxHeight: responsiveHeight(10),
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: responsiveWidth(4),
            paddingVertical: responsiveHeight(1.5),
        },
        titleContainer: {
            flex: 1,
            marginHorizontal: responsiveWidth(3),
            justifyContent: "center",
        },
        welcomeContainer: {
            alignItems: "flex-start",
        },
        headerText: {
            ...typography.h5,
            color: colors.white,
            textAlign: "center",
            fontWeight: "600",
            letterSpacing: 0.5,
        },
        welcomeText: {
            ...typography.h6,
            color: colors.white,
            textAlign: "left",
            fontWeight: "500",
            lineHeight: 22,
        },
        nameText: {
            color: colors.secondary,
            fontWeight: "700",
            textTransform: "capitalize",
        },
        subtitleText: {
            ...typography.caption,
            color: colors.white,
            opacity: 0.8,
            marginTop: 2,
            fontWeight: "400",
        },
        iconButton: {
            padding: responsiveWidth(2.5),
            borderRadius: responsiveWidth(6),
            alignItems: "center",
            justifyContent: "center",
            minWidth: responsiveWidth(10),
            minHeight: responsiveWidth(10),
        },
        placeholder: {
            width: responsiveWidth(10),
            height: responsiveWidth(10),
        },
    });
