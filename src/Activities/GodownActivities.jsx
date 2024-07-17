import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';
import { useThemeContext } from '../Context/ThemeContext';
import { typography } from '../Constants/helper';
import { api } from '../Constants/api';
import Icon from 'react-native-vector-icons/FontAwesome';
import FontistoIcons from 'react-native-vector-icons/Fontisto';

const GodownActivities = () => {
    const { colors, customStyles } = useThemeContext();
    const [godownData, setGodownData] = useState([])

    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const [fromDate, setFromDate] = useState(currentDate);
    const [toDate, setToDate] = useState(currentDate);
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    const dropDownData = [
        { label: "MILL", value: 1 },
        { label: "GODOWN", value: 2 }
    ];
    const [dropDownValue, setDropDownValue] = useState(dropDownData[0].label);

    const [activeAccordion, setActiveAccordion] = useState(null);
    const [activeTab, setActiveTab] = useState();
    const [expandedEntry, setExpandedEntry] = useState(null);
    const [expandedEntries, setExpandedEntries] = useState({});

    useEffect(() => {
        getGodownActivities(fromDate.toISOString(), toDate.toISOString(), dropDownValue);
    }, [fromDate, toDate, dropDownValue]);

    const getGodownActivities = async (from, to, dropValue) => {
        try {
            const response = await fetch(api.getGodownActivities(from, to, dropValue));
            const jsonData = await response.json();

            if (jsonData.success) {
                const filteredData = jsonData.data.map(day => ({
                    EntryDate: day.EntryDate,
                    DayEntries: [day.DayEntries[0]]  // Only take the first entry for each day
                }));

                setGodownData(filteredData);
            }
        } catch (err) {
            console.log("Error fetching data:", err);
        }
    };

    const onFromDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || fromDate;
        setShowFromPicker(Platform.OS === 'ios');
        setFromDate(currentDate);
    };

    const onToDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || toDate;
        setShowToPicker(Platform.OS === 'ios');
        setToDate(currentDate);
    };

    const toggleEntry = (entryId) => {
        setExpandedEntry(expandedEntry === entryId ? null : entryId);
    };

    const calculateTotals = (data) => {
        let totals = {
            inward: 0,
            management: 0,
            outward: 0,
            otherGodown: 0
        };

        let totalsForDay = {};

        data.forEach(day => {
            let dailyTotal = {
                inward: 0,
                management: 0,
                outward: 0,
                otherGodown: 0
            };

            day.DayEntries.forEach(entry => {
                dailyTotal.inward += entry.PurchaseTotal;
                dailyTotal.management += entry.Handle + entry.WGChecking;
                dailyTotal.outward += entry.SalesTotal;
                dailyTotal.otherGodown += entry.SalesOtherGodown;
            });

            dailyTotal.inward = dailyTotal.inward.toFixed(2);
            dailyTotal.management = dailyTotal.management.toFixed(2);
            dailyTotal.outward = dailyTotal.outward.toFixed(2);
            dailyTotal.otherGodown = dailyTotal.otherGodown.toFixed(2);

            totalsForDay[day.EntryDate] = dailyTotal;

            totals.inward += parseFloat(dailyTotal.inward);
            totals.management += parseFloat(dailyTotal.management);
            totals.outward += parseFloat(dailyTotal.outward);
            totals.otherGodown += parseFloat(dailyTotal.otherGodown);
        });

        totals.inward = totals.inward.toFixed(2);
        totals.management = totals.management.toFixed(2);
        totals.outward = totals.outward.toFixed(2);
        totals.otherGodown = totals.otherGodown.toFixed(2);

        return { totals, totalsForDay };
    };

    const { totals, totalsForDay } = calculateTotals(godownData);

    const renderItem = ({ item }) => {
        const isActive = activeAccordion === item.EntryDate;
        const dailyTotal = totalsForDay[item.EntryDate];
        const isExpanded = expandedEntries[item.EntryDate];

        const updatedTabData = [
            { label: "Inward", value: 1, total: dailyTotal.inward },
            { label: "Management", value: 2, total: dailyTotal.management },
            { label: "Outward", value: 3, total: dailyTotal.outward },
        ];

        const grandTotal = parseFloat(dailyTotal.inward) + parseFloat(dailyTotal.management) + parseFloat(dailyTotal.outward);
        // console.log(grandTotal.toFixed(2))

        return (
            <View style={styles(colors).accordionContainer}>
                {/* Header */}
                <View style={styles(colors).accordionHeader} >
                    <View style={styles(colors).accordionView}>
                        <View style={styles(colors).accordionIconView}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                <Icon name="calendar-o" color={colors.accent}
                                    size={20}
                                />
                                <Text style={styles(colors).accordionIconText}>
                                    {new Date(item.EntryDate).toLocaleDateString('en-GB', {
                                        day: "2-digit",
                                        month: "2-digit"
                                    }).slice(0, 5)}
                                </Text>
                            </View>
                            <View>
                                <Text style={[styles(colors).accordionIconText, { color: colors.accent }]}>{grandTotal.toFixed(2)}</Text>
                            </View>

                        </View>
                        <View style={styles(colors).accordionHeaderInner}>
                            {updatedTabData.map(tab => (
                                <TouchableOpacity
                                    key={tab.value}
                                    style={[
                                        styles(colors).tab,
                                        activeTab === tab.value && styles(colors).activeTab
                                    ]}
                                    onPress={() => {
                                        if (activeAccordion === item.EntryDate && activeTab === tab.value) {
                                            setActiveAccordion(null);
                                            setActiveTab(null);
                                        } else {
                                            // If a different tab is tapped, set it as active
                                            setActiveAccordion(item.EntryDate);
                                            setActiveTab(tab.value);
                                        }
                                    }}
                                >
                                    <Text style={[
                                        styles(colors).tabText,
                                        activeTab === tab.value && styles(colors).activeTabText
                                    ]}>
                                        {tab.label} {"\n"}
                                        <Text style={styles(colors).accordionHeaderInnerTextHighlight}>{tab.total}</Text>

                                    </Text>
                                </TouchableOpacity>
                            ))}

                        </View>
                    </View>
                </View>

                {/* Expanded Content */}
                {isActive && (
                    <View>
                        {/* Day Entries */}
                        {item.DayEntries.map(entry => {
                            return (
                                <View key={entry.Id} style={styles(colors).dayEntry}>
                                    <View style={styles(colors).entryContent}>
                                        {activeTab === 1 && (
                                            <View style={styles(colors).card}>
                                                <View style={styles(colors).row}>
                                                    <Text style={styles(colors).rowCardTitle}>Purchase</Text>
                                                    <Text style={styles(colors).rowCardText}>{entry.Purchase}</Text>
                                                </View>
                                                <View style={styles(colors).row}>
                                                    <Text style={styles(colors).rowCardTitle}>Godown</Text>
                                                    <Text style={styles(colors).rowCardText}>{entry.OtherGodown}</Text>
                                                </View>
                                                <View style={styles(colors).row}>
                                                    <Text style={styles(colors).rowCardTitle}>Transfer</Text>
                                                    <Text style={styles(colors).rowCardText}>{entry.PurchaseTransfer}</Text>
                                                </View>
                                            </View>
                                        )}
                                        {activeTab === 2 && (
                                            <View style={styles(colors).card}>
                                                <View style={styles(colors).row}>
                                                    <Text style={styles(colors).rowCardTitle}>Handle</Text>
                                                    <Text style={styles(colors).rowCardText}>{entry.Handle}</Text>
                                                </View>
                                                <View style={styles(colors).row}>
                                                    <Text style={styles(colors).rowCardTitle}>WGChecking</Text>
                                                    <Text style={styles(colors).rowCardText}>{entry.WGChecking}</Text>
                                                </View>
                                            </View>
                                        )}
                                        {activeTab === 3 && (
                                            <View style={styles(colors).card}>
                                                <View style={styles(colors).row}>
                                                    <TouchableOpacity onPress={() => toggleEntry(entry.Id)} >
                                                        <Text style={[styles(colors).rowCardTitle, { color: colors.accent }]}>Sales Total</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={() => toggleEntry(entry.Id)} >
                                                        <Text style={[styles(colors).rowCardText, { color: colors.accent }]}>{entry.SalesOnlyTotal}</Text>
                                                    </TouchableOpacity>
                                                </View>

                                                {expandedEntry === entry.Id && (
                                                    <View style={styles(colors).details}>
                                                        <View style={styles(colors).row}>
                                                            <Text style={styles(colors).rowCardTitle}>Lorry Shed</Text>
                                                            <Text style={styles(colors).rowCardText}>{entry.LorryShed}</Text>
                                                        </View>
                                                        <View style={styles(colors).row}>
                                                            <Text style={styles(colors).rowCardTitle}>Vandi Varam</Text>
                                                            <Text style={styles(colors).rowCardText}>{entry.VandiVarum}</Text>
                                                        </View>
                                                        <View style={styles(colors).row}>
                                                            <Text style={styles(colors).rowCardTitle}>DD Sales</Text>
                                                            <Text style={styles(colors).rowCardText}>{entry.DDSales}</Text>
                                                        </View>
                                                    </View>
                                                )}

                                                <View style={styles(colors).row}>
                                                    <Text style={styles(colors).rowCardTitle}>Transfer</Text>
                                                    <Text style={styles(colors).rowCardText}>{entry.SalesTransfer}</Text>
                                                </View>
                                                <View style={styles(colors).row}>
                                                    <Text style={styles(colors).rowCardTitle}>Other Godown</Text>
                                                    <Text style={styles(colors).rowCardText}>{entry.SalesOtherGodown}</Text>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={customStyles.container}>
            <View style={styles(colors).userPickContainer}>
                <TouchableOpacity
                    style={customStyles.datePicker}
                    onPress={() => setShowFromPicker(true)}
                >
                    <FontistoIcons name="date" color={colors.accent} size={20} />
                    <TextInput
                        maxFontSizeMultiplier={1.2}
                        style={customStyles.textInput}
                        value={`${fromDate.getDate().toString().padStart(2, '0')}/${(fromDate.getMonth() + 1).toString().padStart(2, '0')}/${fromDate.getFullYear()}`}
                        editable={false}
                    />
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

                <TouchableOpacity
                    style={customStyles.datePicker}
                    onPress={() => setShowToPicker(true)}
                >
                    <FontistoIcons name="date" color={colors.accent} size={20} />
                    <TextInput
                        maxFontSizeMultiplier={1.2}
                        style={customStyles.textInput}
                        value={`${toDate.getDate().toString().padStart(2, '0')}/${(toDate.getMonth() + 1).toString().padStart(2, '0')}/${toDate.getFullYear()}`}
                        editable={false}
                    />
                    {showToPicker && (
                        <DateTimePicker
                            value={toDate}
                            mode="date"
                            display="default"
                            onChange={onToDateChange}
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
                        <FontistoIcons name="map-marker-alt"
                            color={colors.accent} size={20}
                            style={{ marginRight: 10, }}
                        />
                    )}
                    onChange={item => {
                        setDropDownValue(item.label);
                    }}
                    maxHeight={300}
                    style={customStyles.dropdown}
                    placeholderStyle={customStyles.placeholderStyle}
                    containerStyle={customStyles.dropdownContainer}
                    selectedTextStyle={customStyles.selectedTextStyle}
                    iconStyle={customStyles.iconStyle}
                />
            </View>

            {/* <View style={styles(colors).totalsContainer}>
                <View style={styles(colors).rowContainer}>
                    <View style={styles(colors).totalsInnerContainer}>
                        <Text style={styles(colors).totalsText}>Inwards </Text>
                        <Text style={styles(colors).totalsText}>{totals.inward}</Text>
                    </View>

                    <View style={styles(colors).totalsInnerContainer}>
                        <Text style={styles(colors).totalsText}>Management </Text>
                        <Text style={styles(colors).totalsText}>{totals.management}</Text>
                    </View>
                </View>

                <View style={[styles(colors).rowContainer, { width: "50%", justifyContent: "center" }]}>
                    <View style={styles(colors).totalsInnerContainer}>
                        <Text style={styles(colors).totalsText}>Outward </Text>
                        <Text style={styles(colors).totalsText}>{totals.outward}</Text>
                    </View>
                </View>
            </View> */}

            {/* <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 10 }}>
                <Text style={{ flex: flexValue, textAlign: "center", ...typography.body1(colors), marginLeft: 105 }}>Inwards</Text>
                <Text style={{ flex: flexValue, textAlign: "center", ...typography.body1(colors), marginRight: 20 }}>MG</Text>
                <Text style={{ flex: flexValue, textAlign: "center", ...typography.body1(colors), marginRight: 20 }}>Outwards</Text>
            </View> */}

            <FlatList
                data={godownData}
                renderItem={renderItem}
                keyExtractor={item => item.EntryDate}
                contentContainerStyle={styles(colors).listContainer}
                ListEmptyComponent={() => (
                    <View style={styles(colors).noDataContainer}>
                        <Text style={styles(colors).noDataText}>No data to display</Text>
                    </View>
                )}
            />
        </View>
    )
}

export default GodownActivities

const styles = (colors) => StyleSheet.create({
    userPickContainer: {
        padding: 10,
        flexDirection: "row",
        justifyContent: "space-evenly",
        marginBottom: 20,
    },
    listContainer: {
        paddingBottom: 20,
    },
    noDataContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    noDataText: {
        ...typography.h6(colors)
    },
    accordionContainer: {
        borderWidth: 1,
        borderColor: colors.secondary,
        marginHorizontal: 20,
        borderRadius: 10,
        marginBottom: 15,
    },
    accordionHeader: {
        backgroundColor: colors.secondary,
        borderRadius: 5,
        padding: 15,
    },
    accordionView: {
        // justifyContent: "space-around"
    },
    accordionIconView: {
        flexDirection: "row",
        justifyContent: "space-between"
    },
    accordionIconText: {
        ...typography.h6(colors),
        fontWeight: 'bold',
        marginLeft: 10
    },
    accordionHeaderInner: {
        flexDirection: "row",
        justifyContent: "space-around",
    },


    tab: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 15,
    },
    activeTab: {
        // borderWidth: 1,
        // borderColor: colors.primary,
    },
    tabText: {
        textAlign: "center",
        ...typography.body1(colors),
        fontWeight: "bold",
    },
    activeTabText: {
        textAlign: "center",
        ...typography.body1(colors),
    },
    accordionHeaderInnerTextHighlight: {
        ...typography.h6(colors),
        color: colors.accent,
        fontWeight: "bold"
    },

    dayEntry: {
        // flexDirection: "column",
        // padding: 10,
        // borderBottomWidth: 1,
        // borderBottomColor: colors.border,
    },
    entryContent: {
        // paddingLeft: 20,
        // borderBottomWidth: 1,
        // borderBottomColor: colors.border,
    },

    card: {
        backgroundColor: colors.background,
        borderRadius: 10,
        padding: 15,
        marginVertical: 10,
        // shadowColor: '#000',
        // shadowOffset: {
        //     width: 0,
        //     height: 1
        // },
        // shadowOpacity: 0.22,
        // shadowRadius: 2.22,
        // elevation: 2,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    rowCardTitle: {
        ...typography.h6(colors),
    },
    rowCardText: {
        ...typography.h6(colors),
        fontWeight: 'bold',
    },
    details: {
        marginVertical: 10,
        paddingLeft: 10,
        borderLeftWidth: 2,
        borderLeftColor: colors.accent,
    },







    totalsContainer: {
        flexDirection: 'column',
        justifyContent: "center",
        paddingVertical: 10,
    },
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    totalsInnerContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: "center",
        alignItems: 'center',
        backgroundColor: colors.secondary,
        padding: 10,
        marginRight: 10,
        borderColor: colors.primary,
        borderWidth: 1,
        borderRadius: 5
    },
    totalsText: {
        ...typography.body1(colors)
    },





    entryHeader: {
        flexDirection: 'row',
        // alignContent: 'center',
        // alignItems: 'center',
        paddingVertical: 10,
    },





})