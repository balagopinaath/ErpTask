import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { api } from '../Constants/api';
import PagerView from 'react-native-pager-view';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Dropdown } from 'react-native-element-dropdown';
import { useColorScheme } from 'react-native';
import { customColors, typography } from '../Constants/helper';
import { FlatList } from 'react-native';

const DriverActivities = () => {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const colors = customColors[isDarkMode ? 'dark' : 'light'];

    const [organizedData, setOrganizedData] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState({});

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dropDownValue, setDropDownValue] = useState(1);
    const dropDownData = [
        { label: "MILL", value: 1 },
        { label: "GODOWN", value: 2 }
    ];
    const [expandedDriverIndex, setExpandedDriverIndex] = useState(null);

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

    useEffect(() => {
        const initialSelectedTabs = {};
        const initialSelectedCategories = {};
        organizedData.forEach((driver, index) => {
            initialSelectedTabs[index] = 0; // Initialize each driver with the first tab selected
            initialSelectedCategories[index] = null; // Initialize each driver with no category selected
        });
        setSelectedCategories(initialSelectedCategories);
    }, [organizedData]);

    const showDatepicker = () => {
        setShowDatePicker(true);
    };

    const handleDateChange = (event, date) => {
        setShowDatePicker(false);
        if (date) {
            setSelectedDate(date);
        }
    };

    const formatDate = (date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const handleCategoryPress = (driverIndex, category) => {
        setSelectedCategories(prevState => ({
            ...prevState,
            [driverIndex]: category
        }));
    };

    const toggleDriverAccordion = (driverIndex) => {
        if (expandedDriverIndex === driverIndex) {
            setExpandedDriverIndex(null); // Collapse the accordion if it's already expanded
        } else {
            setExpandedDriverIndex(driverIndex); // Expand the accordion for the selected driver
        }
    };

    const renderTripCategoryButtons = (driverIndex, locationGroups) => {
        return (
            <View style={styles(colors).buttonContainer}>
                {locationGroups.map((group, groupIndex) => (
                    <TouchableOpacity
                        key={groupIndex}
                        style={[styles(colors).tripCategoryButton, {
                            backgroundColor:
                                selectedCategories[driverIndex] === group.TripCategory
                                    ? colors.accent
                                    : colors.primary,
                        }]}
                        onPress={() => handleCategoryPress(driverIndex, group.TripCategory)}
                    >
                        <Text style={styles(colors).buttonText}>
                            {group.TripCategory}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const renderTripDetails = (tripDetails) => {
        return (
            <View style={styles(colors).table}>
                <View style={[styles(colors).tableRow, styles(colors).tableHeader]}>
                    <Text style={styles(colors).columnHeader}>Trip Number</Text>
                    <Text style={styles(colors).columnHeader}>Tonnage</Text>
                    <Text style={styles(colors).columnHeader}>Time</Text>
                </View>

                {tripDetails.map((detail) => (
                    <View key={detail.TripNumber} style={styles(colors).tableRow}>
                        <Text style={styles(colors).tableCell}>{detail.TripNumber}</Text>
                        <Text style={styles(colors).tableCell}>{detail.Trips.length > 0 ? detail.Trips[0].TonnageValue : '-'}</Text>
                        <Text style={styles(colors).tableCell}>{detail.Trips.length > 0 ? detail.Trips[0].EventTime : '-'}</Text>
                    </View>
                ))}
            </View>
        );
    };

    const renderDriverCard = ({ item: driver, index: driverIndex }) => {
        const selectedCategory = selectedCategories[driverIndex];

        let totalTonnage = 0;
        driver.LocationGroup.forEach(group => {
            group.TripDetails.forEach(detail => {
                detail.Trips.forEach(trip => {
                    totalTonnage += parseFloat(trip.TonnageValue);
                });
            });
        });

        let categoryTonnage = 0;
        if (selectedCategory) {
            driver.LocationGroup.forEach(group => {
                if (group.TripCategory === selectedCategory) {
                    group.TripDetails.forEach(detail => {
                        detail.Trips.forEach(trip => {
                            categoryTonnage += parseFloat(trip.TonnageValue);
                        });
                    });
                }
            });
        }

        return (
            <View key={driverIndex} style={styles(colors).card}>
                <TouchableOpacity
                    style={styles(colors).accordionHeader}
                    onPress={() => toggleDriverAccordion(driverIndex)}
                >
                    <Text style={styles(colors).driverName}>{driver.DriverName}</Text>
                    <Text style={styles(colors).driverSubTitle}>Tonnage: {totalTonnage.toFixed(2)}</Text>
                </TouchableOpacity>
                {expandedDriverIndex === driverIndex && (
                    <View style={styles(colors).accordionContent}>
                        {renderTripCategoryButtons(driverIndex, driver.LocationGroup)}
                        <FlatList
                            data={driver.LocationGroup.filter(group => group.TripCategory === selectedCategory)}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={({ item }) => (
                                <View>
                                    {renderTripDetails(item.TripDetails)}
                                </View>
                            )}
                        />
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles(colors).container}>
            <View style={styles(colors).userPickContainer}>
                <View style={styles(colors).datePickerWrapper}>
                    <TouchableOpacity style={styles(colors).datePicker} onPress={showDatepicker}>
                        <TextInput
                            maxFontSizeMultiplier={1.2}
                            style={styles(colors).textInput}
                            value={selectedDate ? formatDate(selectedDate) : ''}
                            editable={false}
                        />
                        <Icon name="calendar" color={colors.accent} size={20} />
                    </TouchableOpacity>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        backgroundColor={colors.primary}
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
                data={organizedData}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderDriverCard}
            />
        </View>
    );
};

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
        color: "#111",
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
    card: {
        width: "95%",
        alignSelf: "center",
        backgroundColor: colors.background,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        borderRadius: 8,
        elevation: 5,
        padding: 10,
        marginBottom: 20,
    },
    driverInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    driverDetail: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    driverName: {
        ...typography.body1(colors),
        fontWeight: '700',
        marginLeft: 5,
    },
    page: {
        flex: 1,
    },
    buttonContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginVertical: 5,
    },
    tripCategoryButton: {
        backgroundColor: colors.primary,
        borderRadius: 30,

        paddingVertical: 5,
        paddingHorizontal: 15,
        margin: 5,
    },
    buttonText: {
        ...typography.body2(colors),
        color: colors.white
    },
    table: {
        borderWidth: 0.75,
        borderColor: colors.secondary,
        borderRadius: 5,
        marginBottom: 10,
        overflow: 'hidden',
    },
    columnHeader: {
        ...typography.body1(colors),
        fontWeight: 'bold',
        paddingHorizontal: 10,
        color: '#333',
    },
    tableHeader: {
        // textAlign: 'center',
        backgroundColor: '#f0f0f0',
        borderBottomWidth: 2,
        borderBottomColor: '#aaa',
    },

    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    tableCell: {
        flex: 1,
        ...typography.body1(colors),
        textAlign: 'center',
        justifyContent: 'center',
    },


});

export default DriverActivities;