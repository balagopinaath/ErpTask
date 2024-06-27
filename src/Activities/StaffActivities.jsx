import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, useColorScheme, ScrollView } from 'react-native';
import { api } from '../Constants/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { Dropdown } from 'react-native-element-dropdown';
import { customColors, typography } from '../Constants/helper';

const StaffActivities = () => {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const colors = customColors[isDarkMode ? 'dark' : 'light'];

    const [organizedData, setOrganizedData] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const dropDownData = [
        { label: "MILL", value: 1 },
        { label: "GODOWN", value: 2 }
    ];
    const [dropDownValue, setDropDownValue] = useState(dropDownData[0].label);

    const reportDropDown = [
        { label: "Individual Activities", value: 1 },
        { label: "Overall Activities", value: 2 }
    ];
    const [reportDropDownValue, setReportDropDownValue] = useState(reportDropDown[0].label);
    const [staffCategoryMap, setStaffCategoryMap] = useState({});

    useEffect(() => {
        getStaffActivities(selectedDate.toISOString(), dropDownValue);
    }, [selectedDate, dropDownValue]);

    const getStaffActivities = async (date, dropValue) => {
        try {
            const response = await fetch(api.getStaffActivities(date, dropValue));
            const jsonData = await response.json();

            if (jsonData.success) {
                setOrganizedData(jsonData.data);

                // const categories = jsonData.data[0]?.Categories || [];
                // setOrganizedData(categories);

                const staffCategoryMap = getStaffCategoryReport(jsonData.data);
                setStaffCategoryMap(staffCategoryMap);
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

    const handleTabClick = (categoryIndex, category) => {
        // Update the active category for the specific card
        setOrganizedData(prevData => {
            const newData = [...prevData];
            newData[categoryIndex].activeCategory = category;
            return newData;
        });
    };

    const renderCategory = ({ item }) => {
        return (
            <View style={styles(colors).categoryContainer}>
                <Text style={styles(colors).categoryTitle}>{item.Category}</Text>
                {renderStaffDetails(item.StaffDetails)}
            </View>
        );
    };

    const renderStaffDetails = (staffDetails) => {
        if (!staffDetails || !Array.isArray(staffDetails) || staffDetails.length === 0) {
            return <Text>No staff details available.</Text>;
        }

        return staffDetails.map(staff => (
            <View key={staff.Id} style={styles(colors).staffDetails}>
                <Text style={styles(colors).staffName}>{staff.StaffName}</Text>
                <Text style={styles(colors).staffInfo}>Category: {staff.Category}</Text>
                <Text style={styles(colors).staffInfo}>Tonnage: {staff.Tonnage}</Text>
            </View>
        ));
    };

    const getStaffCategoryReport = (data) => {
        const staffCategoryMap = {};

        data.forEach(entry => {
            entry.Categories.forEach(category => {
                category.StaffDetails.forEach(staff => {
                    if (!staffCategoryMap[staff.StaffName]) {
                        staffCategoryMap[staff.StaffName] = { categories: {}, totalTonnage: 0 };
                    }
                    if (!staffCategoryMap[staff.StaffName].categories[category.Category]) {
                        staffCategoryMap[staff.StaffName].categories[category.Category] = 0;
                    }
                    staffCategoryMap[staff.StaffName].categories[category.Category] += parseFloat(staff.Tonnage);
                    staffCategoryMap[staff.StaffName].totalTonnage += parseFloat(staff.Tonnage);
                });
            });
        });

        return staffCategoryMap;
    };

    const renderStaffCategoryReport = (staffCategoryMap) => {
        return Object.keys(staffCategoryMap).map(staffName => (
            <View key={staffName} style={styles(colors).staffReportContainer}>
                <View style={{ flexDirection: "row" }}>
                    <Icon name='user-o' size={20} color={colors.accent} style={{ marginRight: 5 }} />
                    <Text style={styles(colors).staffReportName}>
                        {staffName}
                        <Text style={{ color: colors.accent }}>
                            &nbsp;({staffCategoryMap[staffName].totalTonnage.toFixed(2)})
                        </Text>
                    </Text>
                </View>
                {Object.keys(staffCategoryMap[staffName].categories).map(category => (
                    <View key={category} style={{ flexDirection: "row", marginTop: 5 }}>
                        <Icon name='user-o' size={20} color="transparent" style={{ marginRight: 5 }} />
                        <Text style={styles(colors).staffReportCategory}>
                            {category}:
                            <Text style={{ color: colors.primary }}>
                                &nbsp;({staffCategoryMap[staffName].categories[category].toFixed(2)})
                            </Text>
                        </Text>
                    </View>
                ))}
            </View>
        ));
    };

    // OverAll

    const renderOverAllStaffDetails = () => {
        return organizedData.map((category, index) => (
            <View key={category.EntryTime} style={styles(colors).cardContainer}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 15, }}>
                    <View style={{ flexDirection: "row", }}>
                        <Icon name='clock-o' size={20} color={colors.accent} style={{ marginTop: 2.5 }} />
                        <Text style={styles(colors).heading}>
                            {new Date(category.EntryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                </View>
                <View style={styles(colors).tabContainer}>
                    <ScrollView horizontal>
                        {category.Categories.map(cat => (
                            <TouchableOpacity
                                key={cat.Category}
                                style={[
                                    styles(colors).tabItem,
                                    cat.Category === category.activeCategory ? styles(colors).activeTab : null
                                ]}
                                onPress={() => handleTabClick(index, cat.Category)}
                            >
                                <Text style={styles(colors).tabText}>
                                    {cat.Category}
                                    <Text style={{ color: colors.accent }}>
                                        {"\n"}({getCategoryTotal(category, cat.Category)})
                                    </Text>
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
                {renderCategoryDetails(category)}
            </View>
        ));
    };

    const renderCategoryDetails = (category) => {
        const activeCategory = category.activeCategory || category.Categories[0].Category; // Default to the first category if no activeCategory set
        const cat = category.Categories.find(cat => cat.Category === activeCategory);
        if (cat) {
            return cat.StaffDetails.map(detail => (
                <View key={detail.Id} style={styles(colors).detailContainer}>
                    <Text style={styles(colors).staffName}>{detail.StaffName}</Text>
                    <Text style={styles(colors).tonnage}>{detail.Tonnage}</Text>
                </View>
            ));
        }
        return <Text>No staff details available.</Text>;
    };

    const getCategoryTotal = (category, categoryName) => {
        let total = 0;

        category.Categories.forEach(cat => {
            if (cat.Category === categoryName) {
                cat.StaffDetails.forEach(detail => {
                    total += detail.Tonnage;
                });
            }
        });
        return total.toFixed(2); // Adjust as per your formatting needs
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


            {reportDropDownValue === "Individual Activities" ? (
                <ScrollView>
                    {renderStaffCategoryReport(staffCategoryMap)}
                </ScrollView>
            ) : (
                <ScrollView>
                    {renderOverAllStaffDetails()}
                </ScrollView>
            )}

        </View>
    )
}

export default StaffActivities

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


    staffReportContainer: {
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
    staffReportName: {
        ...typography.h6(colors),
        fontWeight: 'bold',
    },
    staffReportCategory: {
        ...typography.body1(colors),
        fontWeight: 'bold',
    },
    individualReportContainer: {
        padding: 10,
    },


    listContent: {
        paddingBottom: 16,
    },
    categoryContainer: {
        marginBottom: 16,
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 8,
    },
    staffDetails: {
        marginBottom: 8,
        paddingLeft: 16,
    },
    staffName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
    },
    staffInfo: {
        fontSize: 14,
        color: colors.text,
    },




    cardContainer: {
        backgroundColor: colors.background,
        borderRadius: 8,
        shadowColor: colors.black, // iOS shadow
        shadowOffset: {
            width: 0,
            height: 1
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3, // Android shadow
        padding: 10,
        marginHorizontal: 15,
        marginVertical: 10,
    },
    heading: {
        textAlign: "center",
        ...typography.h6(colors),
        fontWeight: 'bold',
        marginLeft: 5,
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    tabItem: {
        minWidth: 100,
        maxWidth: 150,
        padding: 8,
        marginRight: 10,
        borderRadius: 5,
        backgroundColor: colors.secondary,
    },
    activeTab: {
        borderWidth: 1.5,
        borderColor: colors.primary,
    },
    tabText: {
        textAlign: "center",
        ...typography.body1(colors),
        fontWeight: 'bold',
    },

    detailContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    staffName: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    tonnage: {
        fontSize: 14,
        color: '#666',
    },



})