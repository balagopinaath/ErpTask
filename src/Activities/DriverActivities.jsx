import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Image, ScrollView, Dimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';

import { api } from '../Constants/api';
import { typography } from '../Constants/helper';
import { useThemeContext } from '../Context/ThemeContext';

import Icon from 'react-native-vector-icons/FontAwesome';
import AntIcon from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { formatTime } from '../Constants/utils';


const DriverActivities = () => {
    const { colors, customStyles } = useThemeContext();

    const [categoryData, setCategoryData] = useState([]);
    const [tripWiseData, setTripWiseData] = useState([]);
    const [timeWiseData, setTimeWiseData] = useState([]);
    const [listData, setListData] = useState([]);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const locationDropDown = [
        { label: "MILL", value: 1 },
        { label: "GODOWN", value: 2 }
    ];
    const [locationDropDownValue, setLocationDropDownValue] = useState(locationDropDown[0].label);

    const [index, setIndex] = useState(2);
    const [routes] = useState([
        { key: 'listWise', title: "Trip Based" },
        { key: 'category', title: "Godown Based" },
        { key: 'abstract', title: "Abstract" },
        { key: 'tripWise', title: "Driver Based" },
        { key: 'timeWise', title: "Time Based" },
    ]);

    useEffect(() => {
        getTripWiseData(selectedDate.toISOString(), locationDropDownValue);
        getDriverData(selectedDate.toISOString(), locationDropDownValue);
        getTimeWiseData(selectedDate.toISOString(), locationDropDownValue);
        getListData(selectedDate.toISOString(), locationDropDownValue)
    }, [selectedDate, locationDropDownValue]);

    const getTripWiseData = async (from, dropValue) => {
        try {
            const response = await fetch(api.getDriverTripBasedActivities(from, dropValue));
            const jsonData = await response.json();
            if (jsonData.success) {
                setTripWiseData(jsonData.data);
            }
        } catch (err) {
            console.log("Error fetching data:", err);
        }
    }

    const getDriverData = async (from, dropValue) => {
        try {
            const response = await fetch(api.getDriverActivities(from, dropValue));
            const jsonData = await response.json();
            if (jsonData.success) {
                setCategoryData(jsonData.data);
            }
        } catch (err) {
            console.log("Error fetching data:", err);
        }
    }

    const getListData = async (from, dropValue) => {
        try {
            const response = await fetch(api.getListBasedDriverActivities(from, dropValue));
            const jsonData = await response.json();
            if (jsonData.success) {
                setListData(jsonData.data);
            }
        } catch (err) {
            console.log("Error fetching data:", err);
        }
    }

    const getTimeWiseData = async (from, dropValue) => {
        try {
            const response = await fetch(api.getTimeBasedDriverActivities(from, dropValue));
            const jsonData = await response.json();
            if (jsonData.success) {
                setTimeWiseData(jsonData.data);
            }
        } catch (err) {
            console.log("Error fetching data:", err);
        }
    }

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
        if (!timeString) {
            return ''; // Handle case where timeString is not provided
        }
        const [hours, minutes, seconds] = timeString.split(':');

        let hoursNum = parseInt(hours, 10);
        const period = hoursNum >= 12 ? 'PM' : 'AM';
        hoursNum = hoursNum % 12 || 12;
        const formattedTime = `${hoursNum}:${minutes} ${period}`;

        return formattedTime;
    };

    const renderCategoryData = () => {
        if (categoryData.length === 0) {
            return (
                <View style={customStyles.noDataContainer}>
                    <Text style={customStyles.noDataText}>No data available</Text>
                </View>
            );
        }
        // Aggregate data by TripCategory
        const categoryGroups = {};

        categoryData.forEach((driver) => {
            driver.LocationGroup.forEach((group) => {
                if (!categoryGroups[group.TripCategory]) {
                    categoryGroups[group.TripCategory] = [];
                }
                group.TripDetails.forEach((detail) => {
                    detail.Trips.forEach((trip) => {
                        categoryGroups[group.TripCategory].push({
                            DriverName: driver.DriverName,
                            TonnageValue: trip.TonnageValue,
                            EventTime: trip.EventTime,
                            ActivityDate: trip.ActivityDate,
                            LocationDetails: trip.LocationDetails,
                        });
                    });
                });
            });
        });

        // Calculate total tonnage for each TripCategory
        const categoryTotals = {};

        Object.keys(categoryGroups).forEach((tripCategory) => {
            categoryTotals[tripCategory] = categoryGroups[tripCategory].reduce(
                (total, trip) => {
                    return total + trip.TonnageValue;
                },
                0
            );
        });

        // Render the grouped data
        return (
            <ScrollView>
                {Object.keys(categoryGroups).map((tripCategory, index) => (
                    <View key={index} style={styles(colors).card}>
                        <Text style={styles(colors).cardTitle}>
                            {tripCategory}
                            <Text style={{ color: colors.accent }}>
                                &nbsp;{categoryTotals[tripCategory].toFixed(2)}
                            </Text>
                        </Text>
                        <View style={styles(colors).categoryRow}>
                            {categoryGroups[tripCategory].map((trip, tripIndex) => (
                                <View key={tripIndex} style={styles(colors).categoryDetail}>
                                    <View style={styles(colors).driverDetail}>
                                        <AntIcon
                                            name="user"
                                            size={20}
                                            color={colors.accent}
                                        />
                                        <Text style={styles(colors).detailText}>
                                            {trip.DriverName}
                                        </Text>
                                    </View>
                                    <View style={styles(colors).tonnageDetail}>
                                        <MaterialIcons
                                            name="weight"
                                            size={20}
                                            color={colors.accent}
                                        />
                                        <Text style={[styles(colors).detailText, { fontWeight: "bold" }]}>
                                            &nbsp;{trip.TonnageValue.toFixed(2)}
                                        </Text>
                                    </View>
                                    <View style={styles(colors).timeDetail}>
                                        <AntIcon
                                            name="clockcircleo"
                                            size={20}
                                            color={colors.accent}
                                        />
                                        <Text style={styles(colors).detailText}>
                                            &nbsp;{convertTo12HourFormat(trip.EventTime)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>
        );
    };

    const getTotalTonnageByCategory = (trips) => {
        const totalTonnageByCategory = {};

        trips.forEach(trip => {
            trip.Categories.forEach(category => {
                if (!totalTonnageByCategory[category.UniqeTripCategory]) {
                    totalTonnageByCategory[category.UniqeTripCategory] = 0;
                }
                totalTonnageByCategory[category.UniqeTripCategory] += category.TonnageValue;
            });
        });

        return totalTonnageByCategory;
    };

    const getTotalTonnageForDriver = (trips) => {
        let totalTonnage = 0;
        trips.forEach((trip) => {
            trip.Categories.forEach((category) => {
                totalTonnage += category.TonnageValue;
            });
        });
        return totalTonnage;
    };

    const renderTripWiseData = () => {
        if (tripWiseData.length === 0) {
            return (
                <View style={customStyles.noDataContainer}>
                    <Text style={customStyles.noDataText}>No data available</Text>
                </View>
            );
        }

        return (
            <ScrollView>
                {tripWiseData.map((driver, index) => (
                    <View key={index} style={styles(colors).card}>
                        <Text style={styles(colors).cardTitle}>{driver.DriverName}
                            <Text style={{ color: colors.accent }}>&nbsp;{getTotalTonnageForDriver(driver.Trips).toFixed(2)}</Text>
                        </Text>

                        {/* Render total TonnageValue for each TripCategory */}
                        <View style={styles(colors).totalsContainer}>
                            {Object.entries(getTotalTonnageByCategory(driver.Trips)).map(([category, totalTonnage], catIndex) => (
                                <View key={catIndex} style={styles(colors).totalRow}>
                                    <Text style={styles(colors).totalCategory}>{category}</Text>
                                    <Text style={[styles(colors).totalAmount, { color: colors.accent }]}>
                                        {totalTonnage.toFixed(2)}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Render individual TripCategory details */}
                        {driver.Trips.map((trip, i) => (
                            <View key={i} style={styles(colors).tripContainer}>
                                <Text style={styles(colors).tripNumber}>{`Trip Number: ${trip.TripNumber}`}</Text>
                                {trip.Categories.map((category, j) => (
                                    <View key={j} style={styles(colors).categoryDetail}>
                                        <View style={styles(colors).categoryIcon}>
                                            <Icon name='building-o' size={20} color={colors.accent} />
                                            <Text style={styles(colors).categoryIconText}>{category.UniqeTripCategory}</Text>
                                        </View>
                                        <View style={styles(colors).categoryValue}>
                                            <Icon name='shopping-bag' size={20} color={colors.accent} />
                                            <Text style={styles(colors).categoryValueText}>{category.TonnageValue.toFixed(2)}</Text>
                                        </View>
                                        <View style={styles(colors).categoryTime}>
                                            <AntIcon name='clockcircleo' size={20} color={colors.accent} />
                                            <Text style={styles(colors).categoryTimeText}>{convertTo12HourFormat(category.EventTime)}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                ))}
            </ScrollView>
        )
    };

    const getDriverCount = (data) => data.length;

    const getTotalTripCount = (data) => {
        let totalTrips = 0;
        data.forEach(driver => {
            driver.LocationGroup.forEach(locationGroup => {
                locationGroup.TripDetails.forEach(tripDetail => {
                    totalTrips += tripDetail.Trips.length;
                });
            });
        });
        return totalTrips;
    };

    const getTotalTonnageByCategories = (data) => {
        const tonnageByCategory = {
            'LRY SHED & LOCAL': 0,
            'OTHER GODOWNS': 0,
            'TRANSFER': 0
        };

        data.forEach(driver => {
            driver.LocationGroup.forEach(locationGroup => {
                const category = locationGroup.TripCategory;
                locationGroup.TripDetails.forEach(tripDetail => {
                    tripDetail.Trips.forEach(trip => {
                        if (tonnageByCategory.hasOwnProperty(category)) {
                            tonnageByCategory[category] += trip.TonnageValue;
                        }
                    });
                });
            });
        });

        const totalTonnage = Object.values(tonnageByCategory).reduce((sum, value) => sum + value, 0);
        return { ...tonnageByCategory, totalTonnage };
    };

    const renderAbstract = () => {
        const driverCount = getDriverCount(categoryData);
        const totalTripCount = getTotalTripCount(categoryData);
        const totalTonnageByCategory = getTotalTonnageByCategories(categoryData);

        return (
            <View style={styles(colors).abstractContainer}>
                <View style={styles(colors).abstractRow}>
                    <View style={styles(colors).abstractBox}>
                        <FeatherIcon name='users' size={20} color={colors.accent} />
                        <Text style={[styles(colors).abstractText, { color: colors.accent, fontWeight: "bold" }]}>{driverCount}</Text>
                        <Text style={styles(colors).abstractText}>Drivers</Text>
                    </View>
                    <View style={styles(colors).abstractBox}>
                        <Icon name='road' size={20} color={colors.accent} />
                        <Text style={[styles(colors).abstractText, { color: colors.accent, fontWeight: "bold" }]}>{totalTripCount}</Text>
                        <Text style={styles(colors).abstractText}>Trips</Text>
                    </View>
                </View>
                <View style={styles(colors).abstractRow}>
                    {Object.entries(totalTonnageByCategory).map(([category, tonnage], index) => {
                        if (category === 'totalTonnage') return null;
                        return (
                            <View key={index} style={styles(colors).abstractBox}>
                                <Icon name='balance-scale' size={20} color={colors.accent} />
                                <Text style={styles(colors).tonnageText}>
                                    {category} {"\n"}
                                    <Text style={{ color: colors.accent, fontWeight: "bold" }}>{tonnage.toFixed(2)}</Text>
                                </Text>
                            </View>
                        );
                    })}
                    <View style={styles(colors).abstractBox}>
                        <Icon name='balance-scale' size={20} color={colors.accent} />
                        <Text style={styles(colors).tonnageText}>
                            {"\t"}Total {"\n"}
                            <Text style={{ color: colors.accent, fontWeight: "bold" }}>{totalTonnageByCategory.totalTonnage.toFixed(2)}</Text>
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderTimeBased = () => {

        return (
            <ScrollView>
                {timeWiseData.map((item, index) => (
                    <View key={index} style={styles(colors).timeContainer}>
                        {item.Trips.map((trip, tripIndex) => (
                            <View key={tripIndex}>
                                <Text style={styles(colors).timeEventTime}>
                                    {formatTime(trip.EventTime)}
                                </Text>
                                <View style={styles(colors).timeTripContainer}>
                                    <View style={{}}>
                                        <Text style={styles(colors).timeText}>
                                            <Icon name='user-o' size={20} color={colors.accent} />
                                            &nbsp;{trip.DriverName}
                                        </Text>
                                        <Text style={styles(colors).timeText}>
                                            <Icon name='building-o' size={20} color={colors.accent} />
                                            &nbsp;{trip.TripCategory}
                                        </Text>
                                    </View>
                                    <View style={{}}>
                                        <Text style={styles(colors).timeText}>
                                            <FeatherIcon name='truck' size={20} color={colors.accent} />
                                            &nbsp;{trip.TripNumber}
                                        </Text>
                                        <Text style={styles(colors).timeText}>
                                            <MaterialIcons name='weight' size={20} color={colors.accent} />
                                            &nbsp;{trip.TonnageValue}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                ))}
            </ScrollView>
        )
    }

    const calculateDriverWiseTotals = (listData) => {
        return listData.map(driver => {
            const totalTonnage = driver.DriverTrips.reduce((total, tripGroup) => {
                return total + tripGroup.Trips.reduce((groupTotal, trip) => {
                    return groupTotal + trip.TonnageValue;
                }, 0);
            }, 0);

            return {
                DriverName: driver.DriverName,
                TotalTonnage: totalTonnage
            };
        });
    };

    const calculateOverallTotal = (listData) => {
        return listData.reduce((total, driver) => {
            return total + driver.DriverTrips.reduce((groupTotal, tripGroup) => {
                return groupTotal + tripGroup.Trips.reduce((tripTotal, trip) => {
                    return tripTotal + trip.TonnageValue;
                }, 0);
            }, 0);
        }, 0);
    };

    const calculateCategoryWiseTotals = (listData) => {
        const categoryTotals = {};

        listData.forEach(driver => {
            driver.DriverTrips.forEach(tripGroup => {
                tripGroup.Trips.forEach(trip => {
                    if (categoryTotals[trip.TripCategory]) {
                        categoryTotals[trip.TripCategory] += trip.TonnageValue;
                    } else {
                        categoryTotals[trip.TripCategory] = trip.TonnageValue;
                    }
                });
            });
        });

        return categoryTotals;
    };

    const groupTripsByVehicleNumber = (driverTrips) => {
        const groupedTrips = {};

        driverTrips.forEach(tripGroup => {
            tripGroup.Trips.forEach(trip => {
                if (!groupedTrips[trip.VehicleNumber]) {
                    groupedTrips[trip.VehicleNumber] = [];
                }
                groupedTrips[trip.VehicleNumber].push(trip);
            });
        });

        return groupedTrips;
    };

    const renderList = () => {
        const driverWiseTotals = calculateDriverWiseTotals(listData);
        const overallTotal = calculateOverallTotal(listData);
        const categoryWiseTotals = calculateCategoryWiseTotals(listData);

        return (
            <ScrollView>
                <View style={{ margin: "auto", paddingTop: 25 }}>
                    {Object.entries(categoryWiseTotals).map(([category, total], index) => (
                        <Text key={index} style={styles(colors).timeText}>{category}:
                            <Text style={{ color: colors.primary }}> {total.toFixed(2)}</Text>
                        </Text>
                    ))}
                    <Text style={styles(colors).timeEventTime}>
                        Total Tonnage:
                        <Text style={{ color: colors.primary }}> {overallTotal.toFixed(2)}</Text>
                    </Text>
                </View>

                {listData.map((item, index) => {
                    const groupedTrips = groupTripsByVehicleNumber(item.DriverTrips);

                    return (
                        <View key={index} style={styles(colors).timeContainer}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                <Text style={styles(colors).timeEventTime}>
                                    <AntIcon name='user' size={20} color={colors.accent} />
                                    &nbsp;{item.DriverName}
                                </Text>
                                <Text style={[styles(colors).timeEventTime, { color: colors.accent }]}>
                                    <MaterialIcons name='weight' size={20} color={colors.accent} />
                                    &nbsp;
                                    {driverWiseTotals.find(total => total.DriverName === item.DriverName)?.TotalTonnage || 0}
                                </Text>
                            </View>

                            {Object.entries(groupedTrips).map(([vehicleNumber, trips], vehicleIndex) => (
                                <View key={vehicleIndex} style={styles.tripGroupContainer}>
                                    <Text style={styles(colors).timeEventTime}>
                                        <FeatherIcon name='truck' size={20} color={colors.accent} />
                                        &nbsp;{vehicleNumber}
                                    </Text>
                                    {trips.map((trip, tripItemIndex) => (
                                        <View key={tripItemIndex} style={styles.tripContainer}>
                                            <View style={{ marginTop: 15 }}>
                                                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
                                                    <Text style={styles(colors).timeText}>
                                                        <FeatherIcon name='clock' size={20} color={colors.accent} />
                                                        &nbsp;{formatTime(trip.EventTime)}
                                                    </Text>
                                                    <Text style={styles(colors).timeText}>
                                                        <FeatherIcon name='clock' size={20} color={colors.accent} />
                                                        &nbsp;{formatTime(trip.EndTime)}
                                                    </Text>
                                                </View>

                                                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 15, borderBottomWidth: 1, borderBottomColor: colors.grey }}>
                                                    <Text style={styles(colors).timeText}>
                                                        <MaterialIcons name='account-arrow-right-outline' size={20} color={colors.accent} />
                                                        &nbsp;{trip.TripNumber}
                                                    </Text>
                                                    <Text style={styles(colors).timeText}>
                                                        <Icon name='building-o' size={20} color={colors.accent} />
                                                        &nbsp;{trip.TripCategory}
                                                    </Text>
                                                    <Text style={styles(colors).timeText}>
                                                        <MaterialIcons name='weight' size={20} color={colors.accent} />
                                                        &nbsp;{trip.TonnageValue}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            ))}
                        </View>
                    );
                })}
            </ScrollView>
        );
    };


    const renderScene = SceneMap({
        listWise: renderList,
        category: renderCategoryData,
        abstract: renderAbstract,
        tripWise: renderTripWiseData,
        timeWise: renderTimeBased,
    });

    const renderTabBar = props => (
        <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: colors.accent }}
            style={{ backgroundColor: colors.primary }}
            scrollEnabled={true}
            tabStyle={{ width: 'auto' }}
            // labelStyle={{ color: colors.text }}
            // activeColor={colors.white}
            // inactiveColor={colors.inactive}
            renderLabel={({ route, focused, color }) => (
                <Text style={[customStyles.tabLabel, { color: focused ? colors.white : colors.inactive }]}>
                    {route.title}
                </Text>
            )}
        />
    );



    return (
        <View style={customStyles.container}>
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
                    data={locationDropDown}
                    value={locationDropDownValue}
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
                        setLocationDropDownValue(item.label);
                    }}
                    maxHeight={300}
                    style={styles(colors).dropdown}
                    placeholderStyle={styles(colors).placeholderStyle}
                    containerStyle={styles(colors).dropdownContainer}
                    selectedTextStyle={styles(colors).selectedTextStyle}
                    iconStyle={styles(colors).iconStyle}
                />
            </View>


            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                initialLayout={{ width: Dimensions.get('window').width }}
                renderTabBar={renderTabBar}
            />




        </View>
    );
};

const styles = (colors) => StyleSheet.create({
    userPickContainer: {
        padding: 10,
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
    cardTitle: {
        ...typography.h6(colors),
        fontWeight: 'bold',
        marginBottom: 15,
    },
    categoryRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-start",
        alignItems: "center",
    },
    categoryDetail: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: colors.secondary
    },
    driverDetail: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
    },
    detailText: {
        ...typography.body1(colors),
    },
    tonnageDetail: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        paddingLeft: 30
    },
    timeDetail: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
    },


    totalsContainer: {
        marginBottom: 10,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.primary,
    },
    totalCategory: {
        ...typography.body1(colors),
        fontWeight: 'bold',
    },
    totalAmount: {
        ...typography.body1(colors),
        fontWeight: 'bold',
    },
    tripContainer: {
        marginBottom: 15,
        // borderBottomWidth: 1,
        // borderBottomColor: colors.primary,
    },
    tripNumber: {
        ...typography.body1(colors),
        fontWeight: 'bold',
        marginBottom: 10,
    },
    categoryDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        paddingHorizontal: 10,
    },
    categoryIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    categoryIconText: {
        width: 100,
        marginLeft: 5,
        ...typography.body1(colors),
    },
    categoryValue: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    categoryValueText: {
        marginLeft: 5,
        ...typography.body1(colors),
    },
    categoryTime: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryTimeText: {
        marginLeft: 5,
        ...typography.body1(colors),
    },



    abstractContainer: {
        backgroundColor: colors.background,
        borderRadius: 8,
        padding: 16,
        margin: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    abstractRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    abstractBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: colors.background,
        padding: 10,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
        width: '48%', // Adjust the width to allow wrapping
    },
    abstractText: {
        ...typography.h6(colors),
        fontWeight: 'bold',
        marginLeft: 10,
    },
    tonnageContainer: {
        marginTop: 8,
    },
    tonnageText: {
        textAlign: "center",
        fontWeight: 'bold',
        ...typography.h6(colors),
        marginLeft: 10,
    },


    timeContainer: {
        borderWidth: 1,
        borderColor: colors.grey,
        borderRadius: 5,
        backgroundColor: colors.background,
        marginHorizontal: 20,
        marginVertical: 20,
        padding: 10,
    },
    timeEventTime: {
        ...typography.h6(colors),
        fontWeight: 'bold',
        marginBottom: 10,
    },
    timeTripContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 15
    },
    timeText: {
        ...typography.h6(colors),
    },

});

export default DriverActivities;