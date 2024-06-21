import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, useColorScheme, FlatList } from 'react-native';
import { api } from '../Constants/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Dropdown } from 'react-native-element-dropdown';
import { customColors, typography } from '../Constants/helper';

const DriverActivities = () => {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const colors = customColors[isDarkMode ? 'dark' : 'light'];

    const [organizedData, setOrganizedData] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState({});

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const dropDownData = [
        { label: "MILL", value: 1 },
        { label: "GODOWN", value: 2 }
    ];
    const [dropDownValue, setDropDownValue] = useState(dropDownData[0].label);
    const [expandedDriverIndex, setExpandedDriverIndex] = useState(null);
    const [expandedCategories, setExpandedCategories] = useState({});

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

    const handleCategoryPress = (driverIndex, category) => {
        setSelectedCategories(prevState => ({
            ...prevState,
            [driverIndex]: category
        }));
    };

    const toggleDriverAccordion = (driverIndex) => {
        if (expandedDriverIndex === driverIndex) {
            setExpandedDriverIndex(null);
        } else {
            setExpandedDriverIndex(driverIndex);
        }
    };

    const calculateTotalTonnage = (tripDetails) => {
        return tripDetails.reduce((total, detail) => {
            return total + detail.Trips.reduce((subTotal, trip) => {
                return subTotal + trip.TonnageValue;
            }, 0);
        }, 0);
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
                            {group.TripCategory} -
                            <Text style={{ color: selectedCategories[driverIndex] === group.TripCategory ? colors.white : "red" }}> {calculateTotalTonnage(group.TripDetails)}</Text>
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const convertTo12HourFormat = (timeString) => {
        const [hours, minutes, seconds] = timeString.split(':');

        let hoursNum = parseInt(hours, 10);
        const period = hoursNum >= 12 ? 'PM' : 'AM';
        hoursNum = hoursNum % 12 || 12;
        const formattedTime = `${hoursNum}:${minutes}:${seconds} ${period}`;

        return formattedTime;
    };

    const renderTripDetails = (tripDetails) => {
        return (
            <View style={styles(colors).table}>
                <View style={[styles(colors).tableRow, styles(colors).tableHeader]}>
                    <Text style={styles(colors).columnHeader}>Trip Number</Text>
                    <Text style={styles(colors).columnHeader}>Tonnage</Text>
                    <Text style={styles(colors).columnHeader}>Time</Text>
                </View>

                {tripDetails
                    .filter(detail => detail.Trips.length > 0) // Filter out empty Trips
                    .map((detail) => (
                        <View key={detail.TripNumber} style={styles(colors).tableRow}>
                            <Text style={styles(colors).tableCell}>{detail.TripNumber}</Text>
                            <Text style={styles(colors).tableCell}>{detail.Trips[0].TonnageValue}</Text>
                            <Text style={styles(colors).tableCell}>
                                {convertTo12HourFormat(detail.Trips[0].EventTime)}
                            </Text>
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
                    <View style={{ flexDirection: "row", marginRight: 10 }}>
                        <Icon name="user-o" color={colors.accent} size={20} />
                        <Text style={styles(colors).driverName}>{driver.DriverName}</Text>
                    </View>
                    <View style={{ flexDirection: "row" }}>
                        <MaterialIcons name="weight-kilogram" color={colors.accent} size={20} />
                        <Text style={styles(colors).driverSubTitle}> {totalTonnage.toFixed(2)}</Text>
                    </View>
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

    const overallTotals = useMemo(() => {
        let totalTonnage = 0;
        let totalTrips = 0;

        organizedData.forEach(driver => {
            driver.LocationGroup.forEach(group => {
                group.TripDetails.forEach(detail => {
                    detail.Trips.forEach(trip => {
                        totalTonnage += parseFloat(trip.TonnageValue);
                        totalTrips += 1;
                    });
                });
            });
        });

        return { totalTonnage, totalTrips };
    }, [organizedData]);

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

            <View style={styles(colors).totalsContainer}>
                <Text style={styles(colors).totalsText}>
                    Total Tonnage: {overallTotals.totalTonnage.toFixed(2)}
                </Text>
                <Text style={styles(colors).totalsText}>
                    Total Trips: {overallTotals.totalTrips}
                </Text>
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
    totalsContainer: {
        justifyContent: "center",
        alignItems: "center",
        padding: 10,
        backgroundColor: colors.primary,
        borderRadius: 5,
        marginVertical: 10,
    },
    totalsText: {
        ...typography.h6(colors),
        color: colors.white,
        fontWeight: 'bold',
    },
    card: {
        width: "95%",
        alignSelf: "center",
        backgroundColor: colors.background,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 2,
        borderRadius: 8,
        padding: 10,
        marginVertical: 10,
    },
    accordionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: 30,
        alignItems: 'center',
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
        justifyContent: "space-around",
        marginVertical: 10,
    },
    tripCategoryButton: {
        flex: 0.4,
        backgroundColor: colors.secondary,
        paddingHorizontal: 8,
    },
    buttonText: {
        textAlign: "center",
        justifyContent: "center",
        ...typography.body1(colors),
        color: colors.white,
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