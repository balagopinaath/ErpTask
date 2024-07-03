import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useState, useEffect } from 'react'

import { Dropdown } from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

import { useThemeContext } from '../Context/ThemeContext';
import { api } from '../Constants/api';
import { typography } from '../Constants/helper';
import Icon from 'react-native-vector-icons/FontAwesome';
import AntIcon from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';


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

    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'driver', title: 'Driver' },
        { key: 'driverTrip', title: 'Trip Wise' },
        { key: 'godown', title: 'Godown' },
        { key: 'delivery', title: 'Delivery' },
        { key: 'staff', title: 'Staff' },
        { key: 'wgCheck', title: 'Weight Check' },
    ]);


    useEffect(() => {
        fetchData()
    }, [fromDate, dropDownValue]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            const [driverResponse, driverTripResponse, godownResponse, deliveryResponse, staffResponse, weightCheckResponse] = await Promise.all([
                fetch(api.getDriverActivities(fromDate.toISOString(), dropDownValue)),
                fetch(api.getDriverTripBasedActivities(fromDate.toISOString(), dropDownValue)),
                fetch(api.getGodownActivitiesAbstract(fromDate.toISOString(), dropDownValue)),
                fetch(api.getDeliveryActivitiesAbstract(fromDate.toISOString(), dropDownValue)),
                fetch(api.getStaffActivitiesAbstract(fromDate.toISOString(), dropDownValue)),
                fetch(api.getweightCheckActivity(fromDate.toISOString(), dropDownValue))
            ]);

            const [driverData, driverTripData, godownData, deliveryData, staffData, weightCheckData] = await Promise.all([
                driverResponse.json(),
                driverTripResponse.json(),
                godownResponse.json(),
                deliveryResponse.json(),
                staffResponse.json(),
                weightCheckResponse.json()
            ]);

            if (driverData.success) setDriverData(driverData.data);
            if (driverTripData.success) setDriverTripData(driverTripData.data);
            if (godownData.success) setGodownData(godownData.data);
            if (deliveryData.success) setDeliveryData(deliveryData.data);
            if (staffData.success) setStaffData(staffData.data);
            if (weightCheckData.success) setWeightCheckData(weightCheckData.data);

        } catch (err) {
            setError('Error fetching data');
            console.log("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    }

    const onFromDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || fromDate;
        setShowFromPicker(Platform.OS === 'ios');
        setFromDate(currentDate);
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const minutesStr = minutes < 10 ? '0' + minutes : minutes;
        const strTime = `${hours}:${minutesStr} ${ampm}`;
        return strTime;
    };

    const renderDriver = () => {
        return (
            <View>
                <Text>Driver</Text>
            </View>
        )
    }

    const renderDriverTrip = () => {
        return (
            <View>
                <Text>Driver Trip</Text>
            </View>
        )
    }

    const renderGodown = () => {
        return (
            <View>
                {godownData.map((item, index) => (
                    <View key={index} style={styles(colors).card}>
                        <View style={{ flexDirection: "row" }}>
                            <Icon name='clock-o' size={20} color={colors.accent} />
                            <Text style={styles(colors).cardTitle}>&nbsp;{formatTime(item.EntryAt)}</Text>
                        </View>

                        <Text><Icon name='clock-o' size={20} color={colors.accent} />
                            &nbsp;{item.PurchaseTotal}</Text>
                        <Text><Icon name='clock-o' size={20} color={colors.accent} />
                            &nbsp;{item.SalesTotal}</Text>
                        <Text><Icon name='clock-o' size={20} color={colors.accent} />
                            &nbsp;{item.ManagementTotal}</Text>
                    </View>
                ))}
            </View>
        )
    }

    const renderDelivery = () => {
        return (
            <View>
                <Text>Delivery</Text>
            </View>
        )
    }

    const renderStaff = () => {
        return (
            <View>
                <Text>Staf</Text>
            </View>
        )
    }

    const renderWGCheck = () => {
        return (
            <View>
                <Text>WGC</Text>
            </View>
        )
    }



    const renderScene = SceneMap({
        driver: renderDriver,
        driverTrip: renderDriverTrip,
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
            renderLabel={({ route, focused, color }) => (
                <Text style={[styles(colors).tabLabel, { color: focused ? colors.white : colors.inactive }]}>
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
                // <ScrollView>
                //     <Accordion title="Driver Data">
                //         <Text>{JSON.stringify(driverData, null, 2)}</Text>
                //     </Accordion>
                //     <Accordion title="Driver Trip Data">
                //         <Text>{JSON.stringify(driverTripData, null, 2)}</Text>
                //     </Accordion>
                //     <Accordion title="Godown Data">
                //         {renderGodown()}
                //     </Accordion>
                //     <Accordion title="Delivery Data">
                //         <Text>{JSON.stringify(deliveryData, null, 2)}</Text>
                //     </Accordion>
                //     <Accordion title="Staff Data">
                //         <Text>{JSON.stringify(staffData, null, 2)}</Text>
                //     </Accordion>
                //     <Accordion title="Weight Check Data">
                //         <Text>{JSON.stringify(weightCheckData, null, 2)}</Text>
                //     </Accordion>
                // </ScrollView>
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

    tabLabel: {
        textAlign: "center",
        ...typography.body1(colors),
        fontWeight: "bold",
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
        marginHorizontal: 10
    },
    cardTitle: {
        ...typography.h6(colors),
        fontWeight: 'bold',
        marginBottom: 15,
    },
})