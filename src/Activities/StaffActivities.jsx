import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions, FlatList, Image } from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { Dropdown } from 'react-native-element-dropdown';

import { typography } from '../Constants/helper';
import { useThemeContext } from '../Context/ThemeContext';
import { api } from '../Constants/api';
import { formatTime } from '../Constants/utils';

import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const StaffActivities = () => {
    const { colors, customStyles } = useThemeContext();

    const [overAllData, setOverAllData] = useState([]);
    const [staffData, setStaffData] = useState([]);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const dropDownData = [
        { label: "MILL", value: 1 },
        { label: "GODOWN", value: 2 }
    ];
    const [dropDownValue, setDropDownValue] = useState(dropDownData[0].label);
    const [expandedCategories, setExpandedCategories] = useState({});

    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: "overall", title: "Godown Based" },
        { key: "staff", title: "Staff Based" },
    ]);

    useEffect(() => {
        fetchData()
    }, [selectedDate, dropDownValue]);


    const fetchData = async () => {
        try {
            const overAllResponse = await fetch(api.getStaffActivities(selectedDate.toISOString(), dropDownValue))
            const staffWiseResponse = await fetch(api.getStaffActivitiesAbstract(selectedDate.toISOString(), dropDownValue))

            const overAllData = await overAllResponse.json()
            const staffData = await staffWiseResponse.json()

            setOverAllData(overAllData.data || [])
            setStaffData(staffData.data || [])

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

    const toggleCategoryExpansion = (entryIndex, categoryIndex) => {
        setExpandedCategories((prevState) => {
            const newExpandedCategories = { ...prevState };
            if (!newExpandedCategories[entryIndex]) {
                newExpandedCategories[entryIndex] = [];
            }
            newExpandedCategories[entryIndex][categoryIndex] = !newExpandedCategories[entryIndex][categoryIndex];
            return newExpandedCategories;
        });
    };

    const renderOverAllStaffDetails = () => {
        return (
            <FlatList
                data={overAllData}
                keyExtractor={(item) => item.EntryTime}
                renderItem={({ item, index: entryIndex }) => {
                    const categories = item.Categories.filter(category => category.StaffDetails.length > 0);

                    return (
                        <View style={styles(colors).card}>
                            <View style={{ flexDirection: "row" }}>
                                <Image source={require('../../assets/images/clock.png')}
                                    style={[styles(colors).icon, { marginRight: 5 }]}
                                />
                                <Text style={[styles(colors).overAllHeader, { color: colors.primary }]}>
                                    {formatTime(item.EntryTime)}
                                </Text>
                            </View>
                            <FlatList
                                data={categories}
                                renderItem={({ item: category, index: categoryIndex }) => (
                                    <TouchableOpacity onPress={() => toggleCategoryExpansion(entryIndex, categoryIndex)}>
                                        <View style={styles(colors).overAllContainer}>
                                            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                                <Text style={[styles(colors).overAllHeader, { flex: 1, }]} numberOfLines={2}>
                                                    <Icon name='building-o' size={20} color={colors.accent} />
                                                    &nbsp;&nbsp;{category.Category}
                                                </Text>
                                                <Text style={[styles(colors).overAllHeader, { color: colors.accent }]}>
                                                    {category.StaffDetails.reduce((sum, staff) => sum + (staff.Tonnage || 0), 0).toFixed(2)}
                                                </Text>
                                            </View>
                                            {expandedCategories[entryIndex]?.[categoryIndex] && (
                                                <View style={styles(colors).overAllDetails}>
                                                    {category.StaffDetails.map((staff, idx) => (
                                                        <View key={idx} style={styles(colors).staffDetails}>
                                                            <Text style={styles(colors).overAllHeader}>
                                                                <Icon name='user-o' size={20} color={colors.accent} />
                                                                &nbsp;&nbsp;{staff.StaffName}
                                                            </Text>
                                                            <Text style={[styles(colors).overAllHeader, { color: colors.accent }]}>
                                                                {staff.Tonnage}
                                                            </Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                )}
                                keyExtractor={(category) => category.Category}
                            />
                        </View>
                    );
                }}
                ListEmptyComponent={() => (
                    <View style={customStyles.noDataContainer}>
                        <Text style={customStyles.noDataText}>No display to show!</Text>
                    </View>
                )}
            />
        );
    };

    const renderOverAllStaffWise = () => {
        return (
            <FlatList
                data={staffData}
                keyExtractor={(item) => item.StaffName}
                renderItem={({ item }) => {

                    const totalTonnage = item.Categories.reduce((sum, category) => {
                        const staffDetails = category.StaffDetails || {};
                        const tonnage = staffDetails.Tonnage || 0;

                        if (Object.keys(staffDetails).length === 0) {
                            return sum;
                        }

                        // console.log(`Category: ${category.Category}, Tonnage: ${tonnage}`); // Log each tonnage value for debugging
                        return sum + tonnage;
                    }, 0);

                    return (
                        <View style={styles(colors).card}>
                            <View style={styles(colors).cardHeader}>
                                <View style={{ flexDirection: "row" }}>
                                    <Image source={require('../../assets/images/driver.png')}
                                        style={[styles(colors).icon, { marginRight: 5, }]}
                                    />
                                    <Text style={styles(colors).cardTitle}>{item.StaffName}</Text>
                                </View>
                                <View style={{ flexDirection: "row" }}>
                                    <Image source={require('../../assets/images/import.png')}
                                        style={[styles(colors).icon, { marginRight: 5, }]}
                                    />
                                    <Text style={styles(colors).cardTonnage}>{totalTonnage.toFixed(2)}</Text>
                                </View>
                            </View>
                            {item.Categories.map((category, index) => {
                                const staffDetails = category.StaffDetails || {};
                                if (Object.keys(staffDetails).length === 0) {
                                    return null; // Skip empty StaffDetails
                                }

                                return (
                                    <View key={index} style={styles(colors).categoryContainer}>
                                        <Text style={styles(colors).categoryTitle}>
                                            <Icon name='building-o' size={20} color={colors.accent} />
                                            &nbsp;&nbsp;{category.Category}
                                        </Text>
                                        <Text style={styles(colors).categoryTitle}>
                                            <MaterialIcons name='weight' size={20} color={colors.accent} />
                                            &nbsp;{staffDetails.Tonnage}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    );
                }}
                ListEmptyComponent={() => (
                    <View style={customStyles.noDataContainer}>
                        <Text style={customStyles.noDataText}>No display to show!</Text>
                    </View>
                )}
            />
        )
    }

    const renderScene = SceneMap({
        overall: renderOverAllStaffDetails,
        staff: renderOverAllStaffWise,
    });

    const renderTabBar = props => (
        <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: colors.accent }}
            style={{ backgroundColor: colors.primary }}
            scrollEnabled={true}
            tabStyle={{ width: 'auto' }}
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

            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                initialLayout={{ width: Dimensions.get('window').width }}
                renderTabBar={renderTabBar}
            />
        </View>
    )
}

export default StaffActivities

const styles = (colors) => StyleSheet.create({
    userPickContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        padding: 10,
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

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,

        margin: 15,
        padding: 15,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardTitle: {
        ...typography.h5(colors),
        fontWeight: 'bold',
    },
    cardTonnage: {
        ...typography.h5(colors),
        fontWeight: 'bold',
        color: colors.accent,
    },
    icon: {
        width: 25,
        height: 25,
    },
    categoryContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.primary,
    },
    categoryTitle: {
        ...typography.body1(colors),
        fontWeight: 'bold',
    },
    categoryDetails: {
        paddingLeft: 10,
        marginTop: 5,
    },
    overAllContainer: {
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingVertical: 10,
    },
    overAllHeader: {
        ...typography.h6(colors),
        flexWrap: "wrap",
        fontWeight: "bold"
    },
    overAllDetails: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    overAllTitle: {
        fontWeight: 'bold',
        fontSize: 14,
        color: colors.primary,
    },
    overAllTonnage: {
        fontWeight: 'bold',
        fontSize: 14,
        color: colors.secondary,
    },
    staffDetails: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingLeft: 10,
        marginTop: 5,
        marginBottom: 5,
    },
})