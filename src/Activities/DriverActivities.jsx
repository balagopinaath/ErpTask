import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, useColorScheme, FlatList } from 'react-native';
import { api } from '../Constants/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { Dropdown } from 'react-native-element-dropdown';
import { customColors, typography } from '../Constants/helper';
import { Image } from 'react-native';

const DriverActivities = () => {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const colors = customColors[isDarkMode ? 'dark' : 'light'];

    const [organizedData, setOrganizedData] = useState([]);
    const [expandedDriver, setExpandedDriver] = useState(false);
    const [expandedTrip, setExpandedTrip] = useState(false);

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
            const response = await fetch(api.getDriverTripBasedActivities(date, dropValue));
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

    const toggleDriverExpand = (driverName) => {
        setExpandedDriver(expandedDriver === driverName ? null : driverName);
    };

    const toggleTripExpand = (tripNumber) => {
        setExpandedTrip(expandedTrip === tripNumber ? null : tripNumber);
    };

    const convertTo12HourFormat = (timeString) => {
        const [hours, minutes, seconds] = timeString.split(':');

        let hoursNum = parseInt(hours, 10);
        const period = hoursNum >= 12 ? 'PM' : 'AM';
        hoursNum = hoursNum % 12 || 12;
        const formattedTime = `${hoursNum}:${minutes} ${period}`;

        return formattedTime;
    };

    const renderDriverItem = ({ item }) => {
        const totalDriverTonnage = item.Trips.reduce((sum, trip) => {
            return sum + trip.Categories.reduce((catSum, cat) => catSum + cat.TonnageValue, 0);
        }, 0);

        const totalDriverTrips = item.Trips.length;
        // console.log(totalDriverTrips)

        return (
            <View key={item.DriverName}>
                <TouchableOpacity onPress={() => toggleDriverExpand(item.DriverName)}
                    style={styles(colors).accordionHeader}
                >
                    <View style={styles(colors).accordionHeaderView}>
                        <Icon name='user-o' size={25} color={colors.accent} />
                        <Text style={styles(colors).headerText}>{item.DriverName}</Text>
                    </View>
                    <View style={styles(colors).accordionHeaderView}>
                        <MaterialIcons name='weight' size={25} color={colors.accent} />
                        <Text style={styles(colors).tonnageText}> {totalDriverTonnage.toFixed(2)}</Text>
                    </View>
                </TouchableOpacity>
                {expandedDriver === item.DriverName && (
                    <View>
                        {item.Trips.map((trip, index) => {
                            const totalTripTonnage = trip.Categories.reduce((catSum, cat) => catSum + cat.TonnageValue, 0);

                            return (
                                <View key={index}>
                                    <TouchableOpacity
                                        onPress={() => toggleTripExpand(trip.TripNumber)}
                                        style={styles(colors).accordionSubHeader}
                                    >
                                        <View style={styles(colors).accordionSubHeaderView}>
                                            <View style={{ flexDirection: "row", justifyContent: "flex-start" }}>
                                                <AntDesign name={expandedTrip === trip.TripNumber ? "minus" : "plus"} size={20} color={colors.accent} />
                                                <Text style={styles(colors).subTitle}>
                                                    Trip Number: {trip.TripNumber} {' '}
                                                    <Text style={[styles(colors).subTitle, { color: colors.accent }]}>({totalTripTonnage.toFixed(2)})</Text>
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                    {expandedTrip === trip.TripNumber && (
                                        <View style={styles(colors).accordionContent}>
                                            {trip.Categories.map((category, catIndex) => (
                                                <View key={catIndex} style={styles(colors).tripDetails}>
                                                    <View style={styles(colors).rows}>
                                                        <Icon name='building-o' size={20} color={colors.accent} style={{ marginRight: 10 }} />
                                                        <Text style={[styles(colors).labelText, { flex: 0.8 }]}>{category.TripCategory}</Text>
                                                    </View>
                                                    <View style={styles(colors).rows}>
                                                        <MaterialIcons name='weight' size={20} color={colors.accent} style={{ marginRight: 5 }} />
                                                        <Text style={styles(colors).labelText}>{category.TonnageValue}</Text>

                                                        <MaterialIcons name='clock-time-five-outline' size={20} color={colors.accent} style={{ marginLeft: 10, marginRight: 5 }} />
                                                        <Text style={styles(colors).labelText}>{convertTo12HourFormat(category.EventTime)}</Text>
                                                    </View>
                                                    <View style={styles(colors).rows}>

                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>
        );
    };

    const totals = () => {
        const totalTrips = organizedData.reduce((acc, driver) => acc + driver.Trips.length, 0);
        const totalTonnageValue = organizedData.reduce((acc, driver) => {
            return acc + driver.Trips.reduce((accTrips, trip) => accTrips + trip.Categories.reduce((accCategories, category) => accCategories + category.TonnageValue, 0), 0);
        }, 0);
        const totalDrivers = organizedData.length;

        return { totalTrips, totalTonnageValue, totalDrivers };
        // console.log('Total number of trips:', totalTrips);
        // console.log('Total TonnageValue:', totalTonnageValue.toFixed(2));
        // console.log('Number of drivers:', totalDrivers);
    }

    const { totalTrips, totalTonnageValue, totalDrivers } = totals();

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

            <View style={styles(colors).overViewCard}>
                <View style={styles(colors).overViewInner}>
                    <Image
                        style={{ width: 40, height: 40 }}
                        source={require('../../assets/images/driver.png')}
                    />
                    <Text style={styles(colors).overViewInnerText}>{totalDrivers}</Text>
                </View>

                <View style={styles(colors).overViewInner}>
                    <Image
                        style={{ width: 40, height: 40 }}
                        source={require('../../assets/images/pick-up.png')}
                    />
                    <Text style={styles(colors).overViewInnerText}>{totalTrips}</Text>
                </View>

                <View style={styles(colors).overViewInner}>
                    <Image
                        style={{ width: 40, height: 40 }}
                        source={require('../../assets/images/measure.png')}
                    />
                    <Text style={styles(colors).overViewInnerText}>{totalTonnageValue.toFixed(2)}</Text>
                </View>
            </View>

            <FlatList
                data={organizedData}
                renderItem={renderDriverItem}
                keyExtractor={(item) => item.DriverName}
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
    overViewCard: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        margin: 25,
    },
    overViewInner: {
        justifyContent: "center",
        alignContent: "center",
        borderWidth: 2,
        borderColor: colors.secondary,
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    overViewInnerText: {
        textAlign: "center",
        ...typography.h4(colors)
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
    // accordionHeader: {
    // flexDirection: 'row',
    // justifyContent: 'space-between',
    // height: 30,
    // alignItems: 'center',
    // },
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

    noDataContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    noDataText: {
        fontSize: 16,
        color: colors.text,
    },


    accordionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: colors.background,
        borderRadius: 10,
        marginVertical: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 2,
        marginHorizontal: 10
    },
    accordionHeaderView: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center"
    },
    headerText: {
        ...typography.h6(colors),
        marginLeft: 10
    },
    tonnageText: {
        ...typography.body1(colors),
        fontWeight: 'bold',
        color: colors.accent,
    },
    accordionSubHeader: {
        // alignItems: 'center',
        marginVertical: 5,
    },
    accordionSubHeaderView: {
        flexDirection: "column",
        justifyContent: "space-evenly",
        alignItems: "center",
    },

    accordionContent: {
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: "center",
        padding: 10,
        // marginBottom: 5,
    },
    tripDetails: {
        width: "45%",
        borderWidth: 0.75,
        borderColor: colors.primary,
        backgroundColor: colors.secondary,
        borderRadius: 15,
        padding: 15,
        marginBottom: 10,
        marginHorizontal: 15
    },
    rows: {
        flexDirection: 'row',
    },
    labelText: {
        ...typography.body1(colors),
        flexWrap: "wrap",
        // marginLeft: 15,
        // marginBottom: 10
    },
    subTitle: {
        ...typography.h6(colors),
        fontWeight: 'bold',
    },

});

export default DriverActivities;