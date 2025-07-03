import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions, Linking } from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import Icon from "react-native-vector-icons/FontAwesome";

import { ImageZoom } from "@likashefqet/react-native-image-zoom";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { api } from "../../constants/api";
import { useThemeContext } from "../../Context/ThemeContext";
import { typography } from "../../constants/helper";

const InwardsActivities = () => {
    const { colors, customStyles } = useThemeContext();

    const [organizedData, setOrganizedData] = useState([]);

    const dropDownData = [
        { label: "INWARD", value: 1 },
        { label: "MACHINE OUTERN", value: 2 },
    ];
    const [dropDownValue, setDropDownValue] = useState(dropDownData[0].label);

    useEffect(() => {
        getActivities();
    }, [dropDownValue]);

    const getActivities = async () => {
        try {
            let response;
            if (dropDownValue === "INWARD") {
                response = await fetch(api.inwardActivity);
            } else if (dropDownValue === "MACHINE OUTERN") {
                response = await fetch(api.machineOutern);
            }

            const jsonData = await response.json();

            if (jsonData.success) {
                setOrganizedData(jsonData.data);
            }
        } catch (err) {
            console.log("Error fetching data:", err);
        }
    };

    const openInBrowser = url => {
        Linking.openURL(url).catch(err =>
            console.error("An error occurred", err),
        );
    };

    return (
        <View style={customStyles.container}>
            <View style={styles(colors).userPickContainer}>
                <Dropdown
                    data={dropDownData}
                    value={dropDownValue}
                    labelField="label"
                    valueField="label"
                    placeholder="Select Location"
                    renderLeftIcon={() => (
                        <Icon
                            name="map-marker"
                            color={colors.accent}
                            size={20}
                            style={{ marginRight: 10 }}
                        />
                    )}
                    onChange={item => {
                        setDropDownValue(item.label);
                    }}
                    maxHeight={300}
                    style={styles(colors).dropdown}
                    placeholderStyle={styles(colors).placeholderStyle}
                    containerStyle={styles(colors).dropdownContainer}
                    selectedTextStyle={styles(colors).selectedTextStyle}
                    iconStyle={styles(colors).iconStyle}
                />

                {organizedData.map((item, index) => (
                    <View key={index} style={styles(colors).imageContainer}>
                        <Icon
                            name="clock-o"
                            size={20}
                            color={colors.accent}
                            style={{ marginTop: 2.5 }}
                        />
                        <Text style={styles(colors).imageContainerText}>
                            Updated at:{" "}
                            {new Date(item.modifiedTime).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" },
                            )}
                        </Text>
                    </View>
                ))}
            </View>

            <GestureHandlerRootView>
                {organizedData.map((item, index) => (
                    <ImageZoom
                        key={index}
                        uri={item.url}
                        minScale={0.5}
                        maxScale={5}
                        doubleTapScale={3}
                        minPanPointers={1}
                        isSingleTapEnabled
                        isDoubleTapEnabled
                        style={styles(colors).image}
                        onSingleTap={() => {
                            openInBrowser(item.url);
                        }}
                    />
                ))}
            </GestureHandlerRootView>
        </View>
    );
};

export default InwardsActivities;

const styles = colors =>
    StyleSheet.create({
        userPickContainer: {
            justifyContent: "space-between",
            alignItems: "center",
            padding: 10,
            marginBottom: 10,
        },
        dropdown: {
            width: "60%",
            height: 50,
            borderColor: "#ddd",
            borderWidth: 0.5,
            borderRadius: 8,
            paddingHorizontal: 8,
            backgroundColor: colors.secondary,
        },
        dropdownContainer: {
            backgroundColor: colors.secondary,
            borderColor: colors.textPrimary,
            borderWidth: 0.5,
            borderRadius: 10,
        },
        placeholderStyle: {
            ...typography.body1(colors),
        },
        selectedTextStyle: {
            ...typography.body1(colors),
        },
        iconStyle: {
            width: 20,
            height: 20,
        },
        imageContainer: {
            flexDirection: "row",
            marginTop: 15,
            paddingHorizontal: 10,
        },
        imageContainerText: {
            ...typography.h6(colors),
            marginLeft: 5,
        },
        image: {
            width: "100%",
            height: 400,
        },
        zoomImage: {
            width: Dimensions.get("window").width,
            height: Dimensions.get("window").height,
        },
    });
