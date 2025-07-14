import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
} from "react-native";
import React, { useState, useEffect } from "react";

import Icon from "react-native-vector-icons/FontAwesome";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Dropdown } from "react-native-element-dropdown";

import { typography } from "../../constants/helper";
import { api } from "../../constants/api";
import { useThemeContext } from "../../Context/ThemeContext";

const DeliveryActivities = () => {
    const { colors, customStyles } = useThemeContext();

    const [deliveryData, setDeliveryData] = useState([]);

    const currentDate = new Date();
    const [fromDate, setFromDate] = useState(currentDate);
    const [showFromPicker, setShowFromPicker] = useState(false);

    const dropDownData = [
        { label: "MILL", value: 1 },
        { label: "GODOWN", value: 2 },
    ];
    const [dropDownValue, setDropDownValue] = useState(dropDownData[0].label);

    useEffect(() => {
        getDeliveryActivities(fromDate.toISOString(), dropDownValue);
    }, [fromDate, dropDownValue]);

    const onFromDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || fromDate;
        setShowFromPicker(Platform.OS === "ios");
        setFromDate(currentDate);
    };

    const getDeliveryActivities = async (from, dropValue) => {
        try {
            const response = await fetch(
                api.getDeliveryActivities(from, dropValue),
            );
            const jsonData = await response.json();

            if (jsonData.success && jsonData.data.length > 0) {
                setDeliveryData(jsonData.data[0].DeliveryList);
            } else {
                setDeliveryData([]);
            }
        } catch (err) {
            console.log("Error fetching data:", err);
        }
    };

    return (
        <View style={customStyles.container}>
            <View style={styles(colors).userPickContainer}>
                <TouchableOpacity
                    style={styles(colors).datePicker}
                    onPress={() => setShowFromPicker(true)}>
                    <TextInput
                        maxFontSizeMultiplier={1.2}
                        style={styles(colors).textInput}
                        value={`${fromDate
                            .getDate()
                            .toString()
                            .padStart(2, "0")}/${(fromDate.getMonth() + 1)
                            .toString()
                            .padStart(2, "0")}/${fromDate.getFullYear()}`}
                        editable={false}
                    />
                    <Icon name="calendar" color={colors.accent} size={20} />
                    {showFromPicker && (
                        <DateTimePicker
                            testID="toDatePicker"
                            is24Hour={true}
                            value={fromDate}
                            mode="date"
                            display="default"
                            onChange={onFromDateChange}
                        />
                    )}
                </TouchableOpacity>

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
            </View>

            <ScrollView>
                {deliveryData.length === 0 ? (
                    <View style={styles(colors).noDataContainer}>
                        <Text style={styles(colors).noDataText}>No Data</Text>
                    </View>
                ) : (
                    <View>
                        {deliveryData.map((item, index) => (
                            <View key={index} style={styles(colors).cardView}>
                                <Text style={styles(colors).headingText}>
                                    {new Date(
                                        `${item.EntryDate}T${item.EntryTime}`,
                                    ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </Text>
                                <View style={styles(colors).rowContainer}>
                                    <View style={styles(colors).rows}>
                                        <Text style={styles(colors).labelText}>
                                            Not Taken:
                                        </Text>
                                        <Text
                                            style={
                                                styles(colors).labelInnerText
                                            }>
                                            {item.NotTaken}
                                        </Text>
                                    </View>

                                    <View style={styles(colors).rows}>
                                        <Text style={styles(colors).labelText}>
                                            Not Verified:
                                        </Text>
                                        <Text
                                            style={
                                                styles(colors).labelInnerText
                                            }>
                                            {item.NotVerified}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles(colors).rowContainer}>
                                    <View style={styles(colors).rows}>
                                        <Text style={styles(colors).labelText}>
                                            Not Delivery:
                                        </Text>
                                        <Text
                                            style={
                                                styles(colors).labelInnerText
                                            }>
                                            {item.NotDelivery}
                                        </Text>
                                    </View>
                                    <View style={styles(colors).rows}>
                                        <Text style={styles(colors).labelText}>
                                            Overall Sales:
                                        </Text>
                                        <Text
                                            style={
                                                styles(colors).labelInnerText
                                            }>
                                            {item.OverAllSales}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

export default DeliveryActivities;

const styles = colors =>
    StyleSheet.create({
        userPickContainer: {
            flexDirection: "row",
            justifyContent: "space-between",
            padding: 10,
        },
        datePicker: {
            width: "45%",
            height: 50,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: colors.secondary,
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 5,
            paddingHorizontal: 10,
        },
        textInput: {
            ...typography.body1(colors),
        },
        dropdown: {
            width: "45%",
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

        noDataContainer: {
            justifyContent: "center",
            alignItems: "center",
            marginTop: 75,
        },
        noDataText: {
            ...typography.h5(colors),
        },
        cardView: {
            backgroundColor: colors.background,
            borderRadius: 10,
            padding: 15,
            marginVertical: 15,
            marginHorizontal: 20,
            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: 1,
            },
            shadowOpacity: 0.22,
            shadowRadius: 2.22,
            elevation: 2,
        },
        headingText: {
            ...typography.h4(colors),
            color: colors.primary,
            fontWeight: "bold",
            marginBottom: 10,
        },
        rowContainer: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 5,
        },
        rows: {
            flexDirection: "row",
        },
        labelText: {
            ...typography.body1(colors),
            marginRight: 5,
        },
        labelInnerText: {
            ...typography.h6(colors),
            fontWeight: "bold",
            color: colors.accent,
        },
    });
