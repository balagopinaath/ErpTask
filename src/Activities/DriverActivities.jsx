import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, useColorScheme, FlatList, Image, ScrollView } from 'react-native';
import { api } from '../Constants/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AntIcons from 'react-native-vector-icons/AntDesign';
import FeatherIcons from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { Dropdown } from 'react-native-element-dropdown';
import { customColors, typography } from '../Constants/helper';

const DriverActivities = () => {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const colors = customColors[isDarkMode ? 'dark' : 'light'];

    const [organizedData, setOrganizedData] = useState([]);
    const [driverData, setDriverData] = useState([]);
    const [expandedDriver, setExpandedDriver] = useState(false);
    const [expandedTrip, setExpandedTrip] = useState(false);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const placeDropDown = [
        { label: "MILL", value: 1 },
        { label: "GODOWN", value: 2 }
    ];
    const [placeDropDownValue, setPlaceDropDownValue] = useState(placeDropDown[0].label);

    const reportDropDown = [
        { label: "Godown Based", value: 1 },
        { label: "Trip Based", value: 2 }
    ];
    const [reportDropDownValue, setReportDropDownValue] = useState(reportDropDown[0].label);
    const [selectedTabs, setSelectedTabs] = useState({});
    const [driverActivityTotals, setDriverActivityTotals] = useState({});

    useEffect(() => {
        // getDriverTripActivities(selectedDate.toISOString(), placeDropDownValue);
        // getDriverActivities(selectedDate.toISOString(), placeDropDownValue);
        getDriverData();
    }, [selectedDate, placeDropDownValue, reportDropDownValue]);

    const getDriverData = async () => {
        try {
            if (reportDropDownValue === "Trip Based") {
                const response = await fetch(api.getDriverTripBasedActivities(selectedDate.toISOString(), placeDropDownValue));
                const jsonData = await response.json();

                if (jsonData.success) {
                    setOrganizedData(jsonData.data);
                }
            } else if (reportDropDownValue === "Godown Based") {
                const response = await fetch(api.getDriverActivities(selectedDate.toISOString(), placeDropDownValue));
                const jsonData = await response.json();

                if (jsonData.success) {
                    setDriverData(jsonData.data);
                    calculateDriverActivitiesTotals(jsonData.data);
                }
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

    const convertTo12HourFormat = (timeString) => {
        const [hours, minutes, seconds] = timeString.split(':');

        let hoursNum = parseInt(hours, 10);
        const period = hoursNum >= 12 ? 'PM' : 'AM';
        hoursNum = hoursNum % 12 || 12;
        const formattedTime = `${hoursNum}:${minutes} ${period}`;

        return formattedTime;
    };

    const toggleDriverExpand = (driverName) => {
        setExpandedDriver(expandedDriver === driverName ? null : driverName);
    };

    const toggleTripExpand = (tripNumber) => {
        setExpandedTrip(expandedTrip === tripNumber ? null : tripNumber);
    };

    const calculateDriverActivitiesTotals = (data) => {
        const driverTotals = {};
        const categoryTotals = {};

        data.forEach(driver => {
            let driverTotal = 0;

            driver.LocationGroup.forEach(location => {
                let categoryTotal = 0;

                location.TripDetails.forEach(tripDetail => {
                    tripDetail.Trips.forEach(trip => {
                        driverTotal += trip.TonnageValue;
                        categoryTotal += trip.TonnageValue;
                    });
                });

                if (!categoryTotals[driver.DriverName]) {
                    categoryTotals[driver.DriverName] = {};
                }
                categoryTotals[driver.DriverName][location.TripCategory] = categoryTotal;
            });

            driverTotals[driver.DriverName] = driverTotal;
        });
        // console.log("Driver Totals:", driverTotals);
        // console.log("Category Totals:", categoryTotals);
        setDriverActivityTotals({ driverTotals, categoryTotals });
    }

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
                        <Text style={styles(colors).headerText}>
                            {item.DriverName}
                        </Text>
                    </View>
                    <View>
                        <View style={styles(colors).accordionHeaderView}>
                            <FeatherIcons name='truck' size={25} color={colors.accent} />
                            <Text style={styles(colors).tonnageText}> {item.Trips.length}</Text>
                        </View>

                        <View style={styles(colors).accordionHeaderView}>
                            <Icon name='shopping-bag' size={25} color={colors.accent} />
                            <Text style={styles(colors).tonnageText}> {totalDriverTonnage.toFixed(2)}</Text>
                        </View>
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
    // console.log(totalTrips)

    const handleTabPress = (driverIndex, tripCategory) => {
        setSelectedTabs(prev => ({
            ...prev,
            [driverIndex]: prev[driverIndex] === tripCategory ? null : tripCategory,
        }));
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
                    data={placeDropDown}
                    value={placeDropDownValue}
                    labelField="label"
                    valueField="label"
                    placeholder="Select Place"
                    renderLeftIcon={() => (
                        <Icon name="map-marker"
                            color={colors.accent} size={20}
                            style={{ marginRight: 10, }}
                        />
                    )}
                    onChange={item => {
                        setPlaceDropDownValue(item.label);
                    }}
                    maxHeight={300}
                    style={styles(colors).dropdown}
                    placeholderStyle={styles(colors).placeholderStyle}
                    containerStyle={styles(colors).dropdownContainer}
                    selectedTextStyle={styles(colors).selectedTextStyle}
                    iconStyle={styles(colors).iconStyle}
                />
            </View>

            <Dropdown
                data={reportDropDown}
                value={reportDropDownValue}
                labelField="label"
                valueField="label"
                placeholder="Select the One"
                renderLeftIcon={() => (
                    <MaterialIcons name="apple-keyboard-option"
                        color={colors.accent} size={20}
                        style={{ marginRight: 10, }}
                    />
                )}
                onChange={item => {
                    setReportDropDownValue(item.label);
                }}
                maxHeight={300}
                style={[styles(colors).dropdown, { width: "55%", marginHorizontal: "auto", marginVertical: 20 }]}
                placeholderStyle={styles(colors).placeholderStyle}
                containerStyle={styles(colors).dropdownContainer}
                selectedTextStyle={styles(colors).selectedTextStyle}
                iconStyle={styles(colors).iconStyle}
            />

            {reportDropDownValue === "Godown Based" ? (
                <ScrollView>
                    {driverData.length === 0 ? (
                        <View style={styles(colors).noDataContainer}>
                            <Text style={styles(colors).noDataText}>No data to display</Text>
                        </View>
                    ) : (
                        driverData.map((driver, index) => (
                            <View key={index} style={styles(colors).card}>
                                <View style={styles(colors).cardHeading}>
                                    <View style={{ flexDirection: "row" }}>
                                        <Icon name='user-o' size={20} color={colors.accent} />
                                        <Text style={styles(colors).cardTitle}>{driver.DriverName}</Text>
                                    </View>
                                    <View style={{ flexDirection: "row" }}>
                                        <Icon name='shopping-bag' size={20} color={colors.accent} />
                                        <Text style={styles(colors).cardTitle}>{driverActivityTotals.driverTotals?.[driver.DriverName] || 0}</Text>
                                    </View>
                                </View>
                                <View style={styles(colors).tabsContainer}>
                                    {driver.LocationGroup.map((location, locIndex) => {
                                        const hasTrips = location.TripDetails.some(tripDetail => tripDetail.Trips.length > 0);

                                        return (
                                            hasTrips && (
                                                <TouchableOpacity
                                                    key={locIndex}
                                                    style={[
                                                        styles(colors).tab,
                                                        selectedTabs[index] === location.TripCategory && styles(colors).activeTab,
                                                    ]}
                                                    onPress={() => handleTabPress(index, location.TripCategory)}
                                                    disabled={!hasTrips} // Disable the tab if there are no trips
                                                >
                                                    <Text
                                                        style={[
                                                            styles(colors).tabTitle,
                                                            selectedTabs[index] === location.TripCategory && styles(colors).activeTabTitle,
                                                        ]}
                                                    >
                                                        {location.TripCategory}
                                                        <Text style={{ color: colors.accent, fontWeight: "bold" }}>
                                                            &nbsp;({(driverActivityTotals.categoryTotals?.[driver.DriverName]?.[location.TripCategory] || 0).toFixed(2)})
                                                        </Text>
                                                    </Text>
                                                </TouchableOpacity>
                                            )
                                        );
                                    })}
                                </View>
                                {driver.LocationGroup.map((location, locIndex) => (
                                    selectedTabs[index] === location.TripCategory && (
                                        <View key={locIndex} style={styles(colors).tripActivityDetails}>
                                            {location.TripDetails.map((tripDetail, tripDetailIndex) => (
                                                <View key={tripDetailIndex} style={styles(colors).tripActivityDetail}>
                                                    <Text style={styles(colors).tripActivityDetailText}>Trip: {tripDetail.TripNumber}</Text>
                                                    {tripDetail.Trips.map((trip, tripIndex) => (
                                                        <View key={tripIndex} style={styles(colors).tripActivity}>
                                                            <View style={{ flexDirection: "row" }}>
                                                                <Icon name='clock-o' size={20} color={colors.accent} />
                                                                <Text style={styles(colors).tripActivityText}>
                                                                    &nbsp;{new Date(trip.CreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </Text>
                                                            </View>
                                                            <View style={{ flexDirection: "row" }}>
                                                                <MaterialIcons name='weight' size={20} color={colors.accent} />
                                                                <Text style={styles(colors).tripActivityText}> {trip.TonnageValue}</Text>
                                                            </View>
                                                        </View>
                                                    ))}
                                                </View>
                                            ))}
                                        </View>
                                    )
                                ))}
                            </View>
                        ))
                    )}
                </ScrollView>
            ) : (
                <FlatList
                    data={organizedData}
                    renderItem={renderDriverItem}
                    keyExtractor={(item) => item.DriverName}
                    ListEmptyComponent={() => (
                        <View style={styles(colors).noDataContainer}>
                            <Text style={styles(colors).noDataText}>No data to display</Text>
                        </View>
                    )}
                />
            )}

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
    overViewCard: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        margin: 25,
    },
    overViewInner: {
        justifyContent: "center",
        alignContent: "center",
        borderWidth: 0.75,
        backgroundColor: colors.secondary,
        borderColor: colors.primary,
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    overViewInnerText: {
        textAlign: "center",
        ...typography.h4(colors)
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
    subTitle: {
        ...typography.h6(colors),
        fontWeight: 'bold',
    },
    accordionContent: {
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: "center",
        padding: 10,
        // marginBottom: 5,
    },
    tripDetails: {
        minWidth: 100,
        maxWidth: 175,
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
        marginHorizontal: 10
    },
    cardHeading: {
        flexDirection: "row",
        justifyContent: "space-between"
    },
    cardTitle: {
        ...typography.h6(colors),
        fontWeight: 'bold',
        marginLeft: 5,
    },
    tabsContainer: {
        flexDirection: 'row',
        justifyContent: "center",
        alignItems: "center"
    },
    tab: {
        minWidth: 100,
        maxWidth: 150,
        padding: 10,
        borderRadius: 10,
        marginRight: 5,
        marginVertical: 10,
    },
    tabTitle: {
        textAlign: "center",
        ...typography.body1(colors),
    },
    activeTab: {
        borderWidth: 1,
        borderColor: colors.primary,
    },
    activeTabTitle: {
        ...typography.body1(colors),
        // color: colors.white,
    },
    tripActivityDetails: {
        flexDirection: "row",
        justifyContent: "space-evenly",
        marginTop: 15,
    },
    tripActivityDetail: {
        // marginBottom: 10,
    },
    tripActivityDetailText: {
        ...typography.body1(colors),
        fontWeight: 'bold',
        marginBottom: 8,
    },
    tripActivity: {
        // marginLeft: 10,
    },
    tripActivityText: {
        ...typography.body1(colors),
        // fontWeight: "bold",
    },
});

export default DriverActivities;