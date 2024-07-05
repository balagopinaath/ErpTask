import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useState, useEffect } from 'react'

import { Dropdown } from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

import { useThemeContext } from '../Context/ThemeContext';
import { api } from '../Constants/api';
import { typography } from '../Constants/helper';
import { calculateDuration, formatTime } from '../Constants/utils';

import Icon from 'react-native-vector-icons/FontAwesome';
import FeatherIcon from 'react-native-vector-icons/Feather';
import AntIcon from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const OverAllAbstract = () => {
    const { colors, customStyles } = useThemeContext();

    const [driverData, setDriverData] = useState([]);
    const [driverTripData, setDriverTripData] = useState([]);
    const [godownData, setGodownData] = useState([]);
    const [deliveryData, setDeliveryData] = useState([]);
    const [staffData, setStaffData] = useState([]);
    const [weightCheckData, setWeightCheckData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const currentDate = new Date();
    const [fromDate, setFromDate] = useState(currentDate);
    const [showFromPicker, setShowFromPicker] = useState(false);

    const dropDownData = [
        { label: "MILL", value: 1 },
        { label: "GODOWN", value: 2 }
    ];
    const [dropDownValue, setDropDownValue] = useState(dropDownData[0].label);

    const [index, setIndex] = useState(2);
    const [routes] = useState([
        { key: 'driver', title: 'Drivers' },
        { key: 'godown', title: 'Godown' },
        { key: 'delivery', title: 'Delivery' },
        { key: 'staff', title: 'Staff' },
        { key: 'wgCheck', title: 'Weight Check' },
    ]);

    useEffect(() => {
        let isMounted = true; // Track if the component is mounted

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const [
                    driverResponse,
                    driverTripResponse,
                    godownResponse,
                    deliveryResponse,
                    staffResponse,
                    weightCheckResponse
                ] = await Promise.all([
                    fetch(api.getDriverActivities(fromDate.toISOString(), dropDownValue)),
                    fetch(api.getDriverTripBasedActivities(fromDate.toISOString(), dropDownValue)),
                    fetch(api.getGodownActivitiesAbstract(fromDate.toISOString(), dropDownValue)),
                    fetch(api.getDeliveryActivitiesAbstract(fromDate.toISOString(), dropDownValue)),
                    fetch(api.getStaffActivitiesAbstract(fromDate.toISOString(), dropDownValue)),
                    fetch(api.getweightCheckActivity(fromDate.toISOString(), dropDownValue))
                ]);

                if (!isMounted) {
                    return; // Component is unmounted, exit early
                }

                const [
                    driverData,
                    driverTripData,
                    godownData,
                    deliveryData,
                    staffData,
                    weightCheckData
                ] = await Promise.all([
                    driverResponse.json(),
                    driverTripResponse.json(),
                    godownResponse.json(),
                    deliveryResponse.json(),
                    staffResponse.json(),
                    weightCheckResponse.json()
                ]);

                setDriverData(driverData.data || []);
                setDriverTripData(driverTripData.data || []);
                setGodownData(godownData.data || []);
                setDeliveryData(deliveryData.data || []);
                setStaffData(staffData.data || []);
                setWeightCheckData(weightCheckData.data || []);
            } catch (err) {
                setError('Error fetching data');
                console.log("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false; // Cleanup function to mark component as unmounted
        };
    }, [fromDate, dropDownValue]);

    const onFromDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || fromDate;
        setShowFromPicker(Platform.OS === 'ios');
        setFromDate(currentDate);
    };

    const calculateCategoryTotals = (data) => {
        const categoryTotals = {};

        data.forEach(driver => {
            driver.LocationGroup.forEach(group => {
                if (!categoryTotals[group.TripCategory]) {
                    categoryTotals[group.TripCategory] = 0;
                }
                group.TripDetails.forEach(detail => {
                    categoryTotals[group.TripCategory] += detail?.Trips?.reduce((sum, obj) => sum + (obj?.TonnageValue || 0), 0);
                });
            });
        });

        return categoryTotals;
    };

    const calculateTotalTripsAndDrivers = (data) => {
        let totalDrivers = data.length;
        let totalTrips = data.reduce((sum, driver) => sum + (driver.Trips?.length || 0), 0);
        return { totalDrivers, totalTrips };
    };

    const categoryTotals = calculateCategoryTotals(driverData);
    const totalTonnageValue = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

    const { totalDrivers, totalTrips } = calculateTotalTripsAndDrivers(driverTripData);

    const renderDriver = () => {
        return (
            <View style={{}}>
                {driverData && driverData.length > 0
                    ? (
                        <View>
                            {Object.keys(categoryTotals).map((category, index) => (
                                <View key={index} style={styles(colors).categoryContainer}>
                                    <View style={styles(colors).textContainer}>
                                        <Text style={styles(colors).categoryText}>{category}</Text>
                                        <Text style={styles(colors).tonnageText}>Total Tonnage:
                                            <Text style={{ color: colors.accent, fontWeight: "heavy" }}>&nbsp;{(categoryTotals[category]).toFixed(2)}</Text>
                                        </Text>
                                    </View>
                                </View>
                            ))}
                            <Text style={styles(colors).totalTonnageText}>Total Tonnage Value: {(totalTonnageValue).toFixed(2)}</Text>

                            <View style={styles(colors).infoContainer}>
                                <View style={styles(colors).squareBox}>
                                    <Image source={require('../../assets/images/driver.png')}
                                        style={styles(colors).icon}
                                    />
                                    <Text style={[styles(colors).boxText, { color: colors.accent }]}>
                                        {totalDrivers}
                                        <Text style={styles(colors).boxText}>{"\n"}Drivers</Text>
                                    </Text>
                                </View>
                                <View style={styles(colors).squareBox}>
                                    <Image source={require('../../assets/images/pick-up.png')}
                                        style={styles(colors).icon}
                                    />
                                    <Text style={[styles(colors).boxText, { color: colors.accent }]}>
                                        {totalTrips}
                                        <Text style={styles(colors).boxText}>{"\n"}Trips</Text>
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )
                    : (<View style={styles(colors).noDataContainer}>
                        <Text style={styles(colors).noDataText}>No display to show!</Text>
                    </View>)
                }
            </View>
        )
    }

    const renderGodown = () => {
        return (
            <View>
                {godownData && godownData.length > 0 ? (
                    <View key={index} style={styles(colors).card}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                            <View style={styles(colors).infoRow}>
                                <FeatherIcon name="clock" size={20} color={colors.accent} />
                                <Text style={[styles(colors).boxText, { color: colors.accent }]}>&nbsp;{formatTime(godownData[0].EntryAt)}</Text>
                            </View>

                            <Text style={styles(colors).tonnageText}>Total
                                <Text style={{ color: colors.accent }}>
                                    &nbsp;{(godownData[0].PurchaseTotal + godownData[0].SalesTotal + godownData[0].ManagementTotal).toFixed(2)}
                                </Text>
                            </Text>

                        </View>

                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                            <View>
                                <Text style={styles(colors).categoryText}>Purchase</Text>
                                <Text style={[styles(colors).tonnageText, { color: colors.accent }]}>{godownData[0].PurchaseTotal}</Text>
                            </View>

                            <View>
                                <Text style={styles(colors).categoryText}>Sales</Text>
                                <Text style={[styles(colors).tonnageText, { color: colors.accent }]}>{godownData[0].SalesTotal}</Text>
                            </View>
                        </View>

                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <View>
                                <Text style={styles(colors).categoryText}>Management</Text>
                                <Text style={[styles(colors).tonnageText, { color: colors.accent }]}>{godownData[0].ManagementTotal}</Text>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={styles(colors).noDataContainer}>
                        <Text style={styles(colors).noDataText}>No display to show!</Text>
                    </View>
                )}
            </View>
        )
    }

    const renderDelivery = () => {
        return (
            <View>
                {deliveryData && deliveryData.length > 0
                    ? (
                        <View style={styles(colors).card}>
                            <View style={styles(colors).infoRow}>
                                <FeatherIcon name="clock" size={20} color={colors.accent} />
                                <Text style={[styles(colors).boxText, { color: colors.accent }]}>&nbsp;{formatTime(deliveryData[0].EntryTime)}</Text>
                            </View>

                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}>
                                <View>
                                    <Text style={styles(colors).categoryText}>Sales</Text>
                                    <Text style={[styles(colors).tonnageText, { color: colors.accent }]}>{deliveryData[0].OverAllSales}</Text>
                                </View>

                                <View style={{ alignItems: "flex-end" }}>
                                    <Text style={styles(colors).categoryText}>Not Taken</Text>
                                    <Text style={[styles(colors).tonnageText, { color: colors.accent }]}>{deliveryData[0].NotTaken}</Text>
                                </View>
                            </View>

                            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                <View>
                                    <Text style={styles(colors).categoryText}>Not Verified</Text>
                                    <Text style={[styles(colors).tonnageText, { color: colors.accent }]}>{deliveryData[0].NotVerified}</Text>
                                </View>

                                <View style={{ alignItems: "flex-end" }}>
                                    <Text style={styles(colors).categoryText}>Not Delivered</Text>
                                    <Text style={[styles(colors).tonnageText, { color: colors.accent, textAlign: "center" }]}>{deliveryData[0].NotDelivery}</Text>
                                </View>
                            </View>
                        </View>
                    )
                    : (
                        <View style={styles(colors).noDataContainer}>
                            <Text style={styles(colors).noDataText}>No display to show!</Text>
                        </View>
                    )
                }
            </View>
        )
    }

    const staffTotal = () => {
        let categoryTotals = {};
        let totalStaffCount = 0;

        staffData?.forEach(staff => {
            totalStaffCount++;

            staff?.Categories?.forEach(cat => {
                const categoryName = cat?.Category;
                const tonnage = cat?.StaffDetails?.Tonnage || 0;

                if (categoryTotals[categoryName]) {
                    categoryTotals[categoryName] += tonnage;
                } else {
                    categoryTotals[categoryName] = tonnage;
                }
            });
        });

        // Prepare data in the format with Category name and Total
        let categoryData = [];
        Object.keys(categoryTotals).forEach(category => {
            categoryData.push({ Category: category, Total: categoryTotals[category] });
        });

        return { totalStaffCount, categoryData };
    };

    const calculateOverallStaffTotal = () => {
        const { categoryData } = staffTotal(); // Retrieve category data directly

        if (!categoryData || categoryData.length === 0) {
            return 0; // Return 0 if no category data available
        }

        const overAllStaffTotal = categoryData.reduce((sum, obj) => {
            let total = 0;
            if (obj.Total) {
                total += (obj.Category !== 'OTHERS 1 - PRINT') ? obj.Total : 0;
            }
            return sum + total;
        }, 0);

        return overAllStaffTotal;
    };

    const renderStaff = () => {
        const { totalStaffCount, categoryData } = staffTotal();
        const staffOverAllTotal = calculateOverallStaffTotal();

        const cellWidth = Dimensions.get('window').width * 0.9 / 2;
        const staffTonnageData = staffData.map(staff => {
            const totalTonnage = staff.Categories.reduce((acc, category) => {
                return acc + (category.StaffDetails.Tonnage || 0);
            }, 0);
            return { StaffName: staff.StaffName, TotalTonnage: totalTonnage };
        });

        return (
            <ScrollView style={{}}>
                {staffData && staffData.length > 0
                    ? (
                        <View key={index} style={styles(colors).card}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                <Text style={[styles(colors).boxText, { textAlign: "left", marginBottom: 10 }]}>No of Staffs
                                    <Text style={{ color: colors.accent }}> {totalStaffCount}</Text>
                                </Text>

                                <Text style={[styles(colors).boxText, { textAlign: "left", marginBottom: 10 }]}>Total
                                    <Text style={{ color: colors.accent }}> {staffOverAllTotal.toFixed(2)}</Text>
                                </Text>
                            </View>

                            {categoryData.map((category, index) => (
                                <View key={index} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                                    <View>
                                        <Text style={styles(colors).categoryText}>{category.Category}</Text>
                                        <Text style={[styles(colors).tonnageText, { color: colors.accent }]}>{category.Total.toFixed(2)}</Text>
                                    </View>
                                </View>
                            ))}

                            <View style={styles(colors).table}>
                                <View style={styles(colors).tableHeader}>
                                    <Text style={[styles(colors).headerText, { width: cellWidth }]}>Staff Name</Text>
                                    <Text style={[styles(colors).headerText, { width: cellWidth }]}>Total Tonnage</Text>
                                </View>
                                {staffTonnageData.map((staff, index) => (
                                    <View key={index} style={styles(colors).tableRow}>
                                        <Text style={[styles(colors).cellText, { width: cellWidth }]}>{staff.StaffName}</Text>
                                        <Text style={[styles(colors).cellText, { width: cellWidth }]}>{staff.TotalTonnage.toFixed(2)}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ) : (
                        <View style={styles(colors).noDataContainer}>
                            <Text style={styles(colors).noDataText}>No display to show!</Text>
                        </View>
                    )}
            </ScrollView>
        )
    }

    const countWeightCheckStockItems = () => {
        const stockItems = new Set(weightCheckData.map(item => item.StockItem));
        return stockItems.size;
    };

    const calculateAverages = () => {
        if (weightCheckData.length === 0) {
            return { averageInput: 0, averageOutput: 0 };
        }

        const totals = weightCheckData.reduce((acc, item) => {
            acc.totalInput += item.InputKG || 0;
            acc.totalOutput += item.OutputKG || 0;
            return acc;
        }, { totalInput: 0, totalOutput: 0 });

        const averageInput = totals.totalInput / weightCheckData.length;
        const averageOutput = totals.totalOutput / weightCheckData.length;

        return { averageInput, averageOutput };
    };

    const { averageInput, averageOutput } = calculateAverages();

    const renderWGCheck = () => {
        const cellWidth = Dimensions.get("window").width * 0.9 / 3;

        return (
            <ScrollView style={{}}>
                {weightCheckData && weightCheckData.length > 0
                    ? (
                        <View key={index} style={styles(colors).card}>
                            <Text style={[styles(colors).boxText, { textAlign: "left", marginBottom: 10 }]}>No of Items
                                <Text style={{ color: colors.accent }}> {countWeightCheckStockItems()}</Text>
                            </Text>

                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                                <View>
                                    <Text style={styles(colors).categoryText}>Average Input</Text>
                                    <Text style={[styles(colors).tonnageText, { color: colors.accent }]}>{averageInput.toFixed(2)}</Text>
                                </View>

                                <View>
                                    <Text style={styles(colors).categoryText}>Average Output</Text>
                                    <Text style={[styles(colors).tonnageText, { color: colors.accent }]}>{averageOutput.toFixed(2)}</Text>
                                </View>
                            </View>

                            <View style={styles(colors).table}>
                                <View style={styles(colors).tableHeader}>
                                    <Text style={[styles(colors).headerText, { width: cellWidth }]}>Stock Item</Text>
                                    <Text style={[styles(colors).headerText, { width: cellWidth }]}>Output KG</Text>
                                    <Text style={[styles(colors).headerText, { width: cellWidth }]}>Duration</Text>
                                </View>
                                {weightCheckData.map((item, index) => (
                                    <View key={index} style={styles(colors).tableRow}>
                                        <Text style={[styles(colors).cellText, { width: cellWidth }]}>{item.StockItem}</Text>
                                        <Text style={[styles(colors).cellText, { width: cellWidth }]}>{item.OutputKG}</Text>
                                        <Text style={[styles(colors).cellText, { width: cellWidth }]}>{calculateDuration(item.StartTime, item.EndTime)}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    ) : (
                        <View style={styles(colors).noDataContainer}>
                            <Text style={styles(colors).noDataText}>No display to show!</Text>
                        </View>
                    )}
            </ScrollView>
        )
    }

    const renderScene = SceneMap({
        driver: renderDriver,
        godown: renderGodown,
        delivery: renderDelivery,
        staff: renderStaff,
        wgCheck: renderWGCheck,
    });

    const renderTabBar = props => (
        <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: colors.accent }}
            style={{ backgroundColor: colors.primary }}
            scrollEnabled={true}
            tabStyle={{ width: 'auto' }}
            renderLabel={({ route, focused, color }) => (
                <Text style={[customStyles.tabLabel, { color: focused ? colors.white : colors.textPrimary }]}>
                    {route.title}
                </Text>
            )}
        />
    );

    return (
        <View style={customStyles.container}>
            <View style={styles(colors).userPickContainer}>
                <TouchableOpacity
                    style={styles(colors).datePicker}
                    onPress={() => setShowFromPicker(true)}
                >
                    <TextInput
                        maxFontSizeMultiplier={1.2}
                        style={styles(colors).textInput}
                        value={`${fromDate.getDate().toString().padStart(2, '0')}/${(fromDate.getMonth() + 1).toString().padStart(2, '0')}/${fromDate.getFullYear()}`}
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

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} />
            ) : error ? (
                <Text style={styles(colors).errorText}>{error}</Text>
            ) : (

                <TabView
                    navigationState={{ index, routes }}
                    renderScene={renderScene}
                    onIndexChange={setIndex}
                    initialLayout={{ width: Dimensions.get('window').width }}
                    renderTabBar={renderTabBar}
                />
            )}
        </View>
    )
}

export default OverAllAbstract

const styles = (colors) => StyleSheet.create({
    userPickContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 10
    },
    datePicker: {
        width: "45%",
        height: 50,
        flexDirection: 'row',
        justifyContent: "space-between",
        alignItems: 'center',
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
        backgroundColor: colors.background === '#000000' ? colors.black : colors.white,
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
        marginHorizontal: 15,
        marginVertical: 25,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    categoryText: {
        // textAlign: "center",
        ...typography.h6(colors),
        fontWeight: 'bold',
    },
    tonnageText: {
        // textAlign: "center",
        ...typography.h6(colors),
        fontWeight: "bold"
    },
    boxText: {
        ...typography.h6(colors),
        fontWeight: "bold",
        textAlign: "center",
    },

    table: {
        width: "100%",
        borderWidth: 1,
        borderColor: colors.grey,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: colors.secondary,
        borderBottomWidth: 1,
        borderColor: colors.grey,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: colors.grey,
    },
    headerText: {
        padding: 10,
        fontWeight: 'bold',
        borderRightWidth: 1,
        borderColor: colors.grey,
        textAlign: 'center',
        flexWrap: "wrap",
        ...typography.body2(colors)
    },
    cellText: {
        padding: 10,
        borderRightWidth: 1,
        borderColor: '#ddd',
        textAlign: 'center',
        flexWrap: 'wrap',
        ...typography.body1(colors),
        fontWeight: "bold"
    },

    noDataContainer: {
        // flex: 1,
        // justifyContent: "center",
        // alignItems: "center",
        // marginTop: 250,
    },
    noDataText: {
        marginTop: 250,
        textAlign: "center",
        ...typography.h6(colors),
        flexWrap: "wrap"
    },


    categoryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.secondary,
        borderRadius: 5,
        padding: 10,
        margin: 15,
    },
    textContainer: {
        flex: 1,
    },
    totalTonnageText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
        marginTop: 10,
        textAlign: 'center',
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginVertical: 20,
        flexWrap: "wrap",
    },
    squareBox: {
        width: 100,
        height: 100,
        backgroundColor: colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        padding: 10,
        margin: 15
    },
    icon: {
        width: 25,
        height: 25,
    },
})