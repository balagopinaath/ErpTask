import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, useColorScheme, FlatList } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { customColors, typography } from '../Constants/helper';
import { api } from '../Constants/api';

const GodownActivities = () => {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const colors = customColors[isDarkMode ? 'dark' : 'light'];

    const [godownData, setGodownData] = useState([])

    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const [fromDate, setFromDate] = useState(firstDayOfMonth);
    const [toDate, setToDate] = useState(new Date());
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    const dropDownData = [
        { label: "MILL", value: 1 },
        { label: "GODOWN", value: 2 }
    ];
    const [dropDownValue, setDropDownValue] = useState(dropDownData[0].label);

    const tabData = [
        { label: "INWARD", value: 1 },
        { label: "MANAGEMENT", value: 2 },
        { label: "OUTWARD", value: 3 },
    ];

    const [activeAccordion, setActiveAccordion] = useState(null);
    const [activeTab, setActiveTab] = useState(tabData[0].value);

    useEffect(() => {
        getGodownActivities(fromDate.toISOString(), toDate.toISOString(), dropDownValue);
    }, [fromDate, toDate, dropDownValue]);

    const onFromDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || fromDate;
        setShowFromPicker(Platform.OS === 'ios');
        setFromDate(currentDate);
    };

    const onToDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || toDate;
        setShowToPicker(Platform.OS === 'ios');
        setToDate(currentDate);
    };

    const getGodownActivities = async (from, to, dropValue) => {
        try {
            const response = await fetch(api.getGodownActivities(from, to, dropValue));
            const jsonData = await response.json();

            if (jsonData.success) {
                setGodownData(jsonData.data);
            }
        } catch (err) {
            console.log("Error fetching data:", err);
        }
    };

    const formatDateTo12Hour = (dateString) => {
        const date = new Date(dateString);
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';

        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'

        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

        return `${hours}:${formattedMinutes} ${ampm}`;
    };


    const renderItem = ({ item }) => {
        const isActive = activeAccordion === item.EntryDate;
        return (
            <View style={styles(colors).accordionContainer}>
                <TouchableOpacity
                    style={styles(colors).accordionHeader}
                    onPress={() => setActiveAccordion(isActive ? null : item.EntryDate)}
                >
                    <View style={{ flexDirection: "row" }}>
                        <Icon name="calendar-o" color={colors.accent} size={20} style={{ marginRight: 10 }} />
                        <Text style={styles(colors).accordionHeaderText}>
                            {new Date(item.EntryDate).toLocaleDateString()}
                        </Text>
                    </View>
                    {item.DayEntries
                        .reduce((uniqueEntries, entry) => {
                            if (!uniqueEntries.some(e => e.EntryDate === entry.EntryDate)) {
                                uniqueEntries.push(entry);
                            }
                            return uniqueEntries;
                        }, [])
                        .map(entry => (
                            <View key={entry.Id} style={{ flexDirection: "row" }}>
                                <MaterialIcons name="weight-kilogram" color={colors.accent} size={20} />
                                <Text style={{ ...typography.h6(colors), marginLeft: 5 }}>{entry.PurchaseTotal}</Text>
                            </View>
                        ))
                    }
                </TouchableOpacity>
                {isActive && (
                    <View style={styles(colors).accordionContent}>
                        <View style={styles(colors).tabContainer}>
                            {tabData.map(tab => (
                                <TouchableOpacity
                                    key={tab.value}
                                    style={[
                                        styles(colors).tab,
                                        activeTab === tab.value && styles(colors).activeTab
                                    ]}
                                    onPress={() => setActiveTab(tab.value)}
                                >
                                    <Text style={[
                                        styles(colors).tabText,
                                        activeTab === tab.value && styles(colors).activeTabText
                                    ]}>{tab.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {item.DayEntries.map(entry => {
                            return (
                                <View key={entry.Id} style={styles(colors).dayEntry}>
                                    {activeTab === 1 && (
                                        <View style={styles(colors).card}>
                                            <Text style={[styles(colors).cardTitle, {}]}>Entry Time: {formatDateTo12Hour(entry.EntryAt)}</Text>
                                            <Text style={styles(colors).cardTitle}>TOTAL:
                                                <Text style={styles(colors).cardText}> {entry.PurchaseTotal}</Text>
                                            </Text>
                                            <Text style={styles(colors).cardTitle}>Purchase:
                                                <Text style={styles(colors).cardText}> {entry.Purchase}</Text>
                                            </Text>
                                            <Text style={styles(colors).cardTitle}>Godown:
                                                <Text style={styles(colors).cardText}> {entry.OtherGodown}</Text>
                                            </Text>
                                            <Text style={styles(colors).cardTitle}>Transfer:
                                                <Text style={styles(colors).cardText}> {entry.PurchaseTransfer} </Text>
                                            </Text>
                                        </View>
                                    )}
                                    {activeTab === 2 && (
                                        <View style={styles(colors).card}>
                                            <Text style={styles(colors).cardTitle}>Entry Time: {formatDateTo12Hour(entry.EntryAt)}</Text>
                                            <Text style={styles(colors).cardTitle}>Handle:
                                                <Text style={styles(colors).cardText}> {entry.Handle}</Text>
                                            </Text>
                                            <Text style={styles(colors).cardTitle}>WGChecking:
                                                <Text style={styles(colors).cardText}> {entry.WGChecking}</Text>
                                            </Text>
                                        </View>
                                    )}
                                    {activeTab === 3 && (
                                        <View style={styles(colors).card}>
                                            <Text style={styles(colors).cardTitle}>Entry Time: {formatDateTo12Hour(entry.EntryAt)}</Text>
                                            <Text style={styles(colors).cardTitle}>Total:
                                                <Text style={styles(colors).cardText}> {entry.SalesTotal} </Text>
                                            </Text>
                                            <Text style={styles(colors).cardTitle}>Sales Total:
                                                <Text style={styles(colors).cardText}> {entry.SalesOnlyTotal}</Text>
                                            </Text>
                                            <Text style={styles(colors).cardTitle}>Lorry Shed:
                                                <Text style={styles(colors).cardText}> {entry.LorryShed}</Text>
                                            </Text>
                                            <Text style={styles(colors).cardTitle}>Vandi Varam:
                                                <Text style={styles(colors).cardText}> {entry.VandiVarum}</Text>
                                            </Text>
                                            <Text style={styles(colors).cardTitle}>DD Sales:
                                                <Text style={styles(colors).cardText}> {entry.DDSales}</Text>
                                            </Text>
                                            <Text style={styles(colors).cardTitle}>Transfer:
                                                <Text style={styles(colors).cardText}> {entry.SalesTransfer}</Text>
                                            </Text>
                                            <Text style={styles(colors).cardTitle}>Other Godown:
                                                <Text style={styles(colors).cardText}> {entry.SalesOtherGodown}</Text>
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )
                        })}
                    </View>
                )}
            </View>
        );
    };


    return (
        <View style={styles(colors).container}>
            <View style={styles(colors).userPickContainer}>
                <View style={styles(colors).datePickerWrapper}>
                    <TouchableOpacity style={styles(colors).datePicker} onPress={() => setShowFromPicker(true)}>
                        <TextInput
                            maxFontSizeMultiplier={1.2}
                            style={styles(colors).textInput}
                            value={`${fromDate.getDate().toString().padStart(2, '0')}/${(fromDate.getMonth() + 1).toString().padStart(2, '0')}/${fromDate.getFullYear()}`}
                            editable={false}
                        />
                        <Icon name="calendar" color={colors.accent} size={20} />
                        {showFromPicker && (
                            <DateTimePicker
                                value={fromDate}
                                mode="date"
                                display="default"
                                onChange={onFromDateChange}
                            />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles(colors).datePicker} onPress={() => setShowToPicker(true)}>
                        <TextInput
                            maxFontSizeMultiplier={1.2}
                            style={styles(colors).textInput}
                            value={`${toDate.getDate().toString().padStart(2, '0')}/${(toDate.getMonth() + 1).toString().padStart(2, '0')}/${toDate.getFullYear()}`}
                            editable={false}
                        />
                        <Icon name="calendar" color={colors.accent} size={20} />
                        {showToPicker && (
                            <DateTimePicker
                                value={toDate}
                                mode="date"
                                display="default"
                                onChange={onToDateChange}
                            />
                        )}
                    </TouchableOpacity>
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

            <FlatList
                data={godownData}
                renderItem={renderItem}
                keyExtractor={item => item.EntryDate}
                contentContainerStyle={styles(colors).listContainer}
            />
        </View>
    )
}

export default GodownActivities

const styles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 10,
    },
    userPickContainer: {
        marginBottom: 20,
    },
    datePickerWrapper: {
        flexDirection: "row",
        justifyContent: "space-between"
    },
    datePicker: {
        width: "45%",
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.secondary,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 5,
        paddingHorizontal: 10,
    },
    textInput: {
        flex: 1,
        ...typography.body1(colors),
    },
    dropdown: {
        alignSelf: "center",
        width: "80%",
        height: 50,
        borderColor: '#ddd',
        borderWidth: 0.5,
        borderRadius: 8,
        paddingHorizontal: 8,
        backgroundColor: colors.secondary,
        marginVertical: 20
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


    listContainer: {
        paddingBottom: 20,
    },
    accordionContainer: {
        marginBottom: 10,
    },
    accordionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: colors.card,
        borderRadius: 5,
    },
    accordionHeaderText: {
        ...typography.body1(colors),
        fontWeight: 'bold',
        color: colors.text,
    },
    accordionContent: {
        padding: 15,
        backgroundColor: colors.card,
        borderRadius: 5,
        marginTop: 5,
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    tab: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: colors.tabBackground,
    },
    activeTab: {
        backgroundColor: colors.primary,
    },
    tabText: {
        color: colors.accent,
        fontWeight: 'bold',
    },
    activeTabText: {
        color: colors.text,
    },
    dayEntry: {
        flexDirection: "column",
        padding: 10,
        // borderBottomWidth: 1,
        // borderBottomColor: colors.border,
    },

    card: {
        backgroundColor: colors.background,
        borderRadius: 10,
        padding: 15,
        marginVertical: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 2,
    },
    cardTitle: {
        ...typography.h6(colors),
        fontWeight: '600',
        marginBottom: 10,
    },
    cardText: {
        ...typography.body1(colors),
        fontWeight: '700',
        marginBottom: 15,
    },
})