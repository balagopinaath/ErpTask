import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, useColorScheme, FlatList, Image } from 'react-native';
import { api } from '../Constants/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { Dropdown } from 'react-native-element-dropdown';
import { customColors, typography } from '../Constants/helper';

const StaffActivities = () => {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const colors = customColors[isDarkMode ? 'dark' : 'light'];

    const [organizedData, setOrganizedData] = useState([]);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const dropDownData = [
        { label: "MILL", value: 1 },
        { label: "GODOWN", value: 2 }
    ];
    const [dropDownValue, setDropDownValue] = useState(dropDownData[0].label);

    useEffect(() => {
        getDriverActivities(selectedDate.toISOString(), dropDownValue);
    }, [selectedDate, dropDownValue]);

    const getDriverActivities = async (date, dropValue) => {
        try {
            console.log(api.getStaffActivities(date, dropValue))
            const response = await fetch(api.getStaffActivities(date, dropValue));
            const jsonData = await response.json();

            if (jsonData.success) {
                setOrganizedData(jsonData.data);
            }
        } catch (err) {
            console.log("Error fetching data:", err);
        }
    };

    const showDatepicker = () => {
        setShowDatePicker(true);
    };

    const handleDateChange = (event, date) => {
        setShowDatePicker(false);
        if (date) {
            setSelectedDate(date);
        }
    };

    return (
        <View style={styles(colors).container}>
            <View style={styles(colors).userPickContainer}>
                <View style={styles(colors).datePickerWrapper}>
                    <TouchableOpacity style={styles(colors).datePicker} onPress={showDatepicker}>
                        <TextInput
                            maxFontSizeMultiplier={1.2}
                            style={styles(colors).textInput}
                            value={`${selectedDate.getDate().toString().padStart(2, '0')}/${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}/${selectedDate.getFullYear()}`}
                            editable={false}
                        />
                        <Icon name="calendar" color={colors.accent} size={20} />
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            backgroundColor={colors.primary}
                            value={selectedDate}
                            mode="date"
                            display="default"
                            onChange={handleDateChange}
                        />
                    )}
                </View>

                <Dropdown
                    data={dropDownData}
                    value={dropDownValue}
                    labelField="label"
                    valueField="label"
                    placeholder="Select Location"
                    renderLeftIcon={() => (
                        <Icon name="map-marker"
                            color={colors.accent} size={20}
                            style={{ marginRight: 10, }}
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


        </View>
    )
}

export default StaffActivities

const styles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 10,
    },
    userPickContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    datePickerWrapper: {
        width: "45%",
    },
    datePicker: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 5,
        paddingHorizontal: 10,
        backgroundColor: colors.secondary
    },
    textInput: {
        flex: 1,
        color: colors.text,
        ...typography.body1(colors),
    },
    dropdown: {
        width: "45%",
        height: 50,
        borderColor: '#ddd',
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
})