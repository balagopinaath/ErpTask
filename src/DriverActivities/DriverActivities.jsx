import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { api } from '../Constants/api';
import PagerView from 'react-native-pager-view';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Dropdown } from 'react-native-element-dropdown';
import { TextInput } from 'react-native';
import { FlatList } from 'react-native';

const DriverActivities = () => {
    const [organizedData, setOrganizedData] = useState([]);
    const pagerRefs = useRef({});
    const [selectedTabs, setSelectedTabs] = useState({});
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const dropDownData = [
        { label: "MILL", value: 1 },
        { label: "GODOWN", value: 2 }
    ]
    const [dropDownValue, setDropDownValue] = useState(null);

    useEffect(() => {
        getDriverActivities(selectedDate.toISOString(), dropDownValue);
    }, [selectedDate, dropDownValue]);

    const getDriverActivities = async (date, dropValue) => {
        try {
            const response = await fetch(api.getDriverActivities(date, dropValue));
            const jsonData = await response.json();

            if (jsonData.success) {
                setOrganizedData(jsonData.data);
            }
        } catch (err) {
            console.log("Error fetching data:", err);
        }
    };

    const handleTabPress = (driverIndex, groupIndex) => {
        setSelectedTabs(prev => ({
            ...prev,
            [driverIndex]: groupIndex
        }));
        pagerRefs.current[driverIndex].setPage(groupIndex);
    };

    const renderTabs = (driverIndex, locationGroups) => {
        return (
            <ScrollView horizontal contentContainerStyle={styles.tabContainer} showsHorizontalScrollIndicator={false}>
                {locationGroups.map((group, groupIndex) => (
                    <TouchableOpacity
                        key={groupIndex}
                        style={[
                            styles.tabButton,
                            selectedTabs[driverIndex] === groupIndex && styles.activeTab
                        ]}
                        onPress={() => handleTabPress(driverIndex, groupIndex)}
                    >
                        <Text>{group.TripCategory}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        );
    };

    const renderTripDetails = (tripDetails) => {
        return (
            <View style={styles.table}>
                {/* Table Header */}
                <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.columnHeader,]}>Trip Number</Text>
                    <Text style={[styles.columnHeader,]}>Tonnage</Text>
                    <Text style={[styles.columnHeader,]}>Event Time</Text>
                </View>

                {/* Table Rows */}
                {tripDetails.map((detail, index) => (
                    <View key={detail.TripNumber} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { flex: 1 }]}>{detail.TripNumber}</Text>
                        <View style={[styles.tableCell, { flex: 1 }]}>
                            {detail.Trips.map((trip, tripIndex) => (
                                <View key={tripIndex}>
                                    <Text style={styles.tripDetailText}>{trip.TonnageValue}</Text>
                                </View>
                            ))}
                        </View>
                        <View style={[styles.tableCell, { flex: 1 }]}>
                            {detail.Trips.map((trip, tripIndex) => (
                                <View key={tripIndex}>
                                    <Text style={styles.tripDetailText}>{trip.EventTime}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ))}
            </View>
        );
    };

    const showDatepicker = () => {
        setShowDatePicker(true);
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setSelectedDate(selectedDate);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.userPickContainer}>
                <View style={styles.datePickerWrapper}>
                    <TouchableOpacity style={styles.datePicker} onPress={showDatepicker}>
                        <TextInput
                            maxFontSizeMultiplier={1.2}
                            style={styles.textInput}
                            value={selectedDate ? new Intl.DateTimeFormat('en-GB').format(selectedDate) : ''}
                            editable={false}
                        />
                        <Icon name="calendar" color="red" size={20} />
                    </TouchableOpacity>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                    />
                )}

                <Dropdown
                    data={dropDownData}
                    value={dropDownValue}
                    labelField="label"
                    valueField="value"
                    placeholder="Select Location"
                    renderLeftIcon={() => (
                        <Icon name="map-pin" color="red" size={20} style={styles.icon} />
                    )}
                    onChange={item => {
                        setDropDownValue(item.label);
                    }}
                    style={styles.dropdown}
                    maxHeight={300}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    iconStyle={styles.iconStyle}
                />
            </View>

            {organizedData.map((driver, driverIndex) => {
                const totalTonnage = driver.LocationGroup.reduce((acc, group) => {
                    return acc + group.TripDetails.reduce((innerAcc, detail) => {
                        return innerAcc + detail.Trips.reduce((innerMostAcc, trip) => {
                            return innerMostAcc + trip.TonnageValue;
                        }, 0);
                    }, 0);
                }, 0);

                return (
                    <View key={driverIndex} style={styles.card}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                            <Text style={styles.driverName}>{driver.DriverName}</Text>
                            <Text style={styles.driverName}>Total KMs: {totalTonnage}</Text>
                        </View>
                        {renderTabs(driverIndex, driver.LocationGroup)}
                        <PagerView
                            style={{ height: 300 }}
                            initialPage={0}
                            ref={el => (pagerRefs.current[driverIndex] = el)}
                            onPageSelected={(e) => handleTabPress(driverIndex, e.nativeEvent.position)}
                        >
                            {driver.LocationGroup.map((group, groupIndex) => (
                                <View key={groupIndex} style={styles.page}>
                                    {renderTripDetails(group.TripDetails)}
                                </View>
                            ))}
                        </PagerView>
                    </View>
                );
            })}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
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
        backgroundColor: '#fff',
    },
    textInput: {
        flex: 1,
        color: "#111",
    },
    dropdown: {
        width: "45%",
        height: 50,
        borderColor: 'gray',
        borderWidth: 0.5,
        borderRadius: 8,
        paddingHorizontal: 8,
        backgroundColor: '#fff',
    },
    icon: {
        marginRight: 5,
    },
    placeholderStyle: {
        fontSize: 16,
    },
    selectedTextStyle: {
        fontSize: 16,
    },
    iconStyle: {
        width: 20,
        height: 20,
    },
    card: {
        marginVertical: 10,
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    driverName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    tabButton: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
        marginHorizontal: 5,
    },
    activeTab: {
        borderBottomColor: 'blue',
    },
    page: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tripDetail: {
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingVertical: 8,
        paddingHorizontal: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tripDetailLast: {
        borderBottomWidth: 0,
    },
    tripDetailText: {
        fontSize: 16,
        color: '#555',
    },
    table: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 10,
        overflow: 'hidden',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    tableHeader: {
        backgroundColor: '#f0f0f0',
        borderBottomWidth: 2,
        borderBottomColor: '#aaa',
    },
    tableCell: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    columnHeader: {
        fontWeight: 'bold',
        paddingHorizontal: 10,
        fontSize: 14,
        color: '#333',
    },
    tripDetailText: {
        fontSize: 14,
        color: '#555',
    },
});

export default DriverActivities;
