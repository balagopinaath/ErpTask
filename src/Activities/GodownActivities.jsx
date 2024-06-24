import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, useColorScheme, FlatList, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { customColors, typography } from '../Constants/helper';
import { api } from '../Constants/api';

const GodownActivities = () => {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const colors = customColors[isDarkMode ? 'dark' : 'light'];

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

    const tabData = [
        { label: "INWARD", value: 1 },
        { label: "MANAGEMENT", value: 2 },
        { label: "OUTWARD", value: 3 },
    ];

    const [activeAccordion, setActiveAccordion] = useState(null);
    const [activeTab, setActiveTab] = useState(tabData[0].value);
    const [expandedEntry, setExpandedEntry] = useState(false);

    useEffect(() => {
        getGodownActivities(fromDate.toISOString(), toDate.toISOString(), dropDownValue);
    }, [fromDate, toDate, dropDownValue]);

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
                // console.log(entry.PurchaseTotal)
                dailyTotal.inward = entry.PurchaseTotal;
                dailyTotal.management = entry.Handle + entry.WGChecking;
                dailyTotal.outward = entry.SalesTotal;
                dailyTotal.otherGodown = entry.SalesOtherGodown;

                dailyTotal.inward = dailyTotal.inward.toFixed(2);
                dailyTotal.management = dailyTotal.management.toFixed(2);
                dailyTotal.outward = dailyTotal.outward.toFixed(2);
                dailyTotal.otherGodown = dailyTotal.otherGodown.toFixed(2);

                totalsForDay[day.EntryDate] = dailyTotal;

                totals.inward += entry.PurchaseTotal;
                totals.management += entry.Handle + entry.WGChecking;
                totals.outward += entry.SalesTotal;
                totals.outward += entry.SalesTotal;
                totals.otherGodown += entry.SalesOtherGodown;
            });

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

        return (
            <View style={styles(colors).accordionContainer}>
                {/* Header */}
                <TouchableOpacity
                    style={styles(colors).accordionHeader}
                    onPress={() => setActiveAccordion(isActive ? null : item.EntryDate)}
                >
                    {/* Display Date and Totals */}
                    <View style={styles(colors).accordionView}>
                        <View style={{ flexDirection: "row" }}>
                            <Icon name="calendar-o" color={colors.accent} size={20} style={{ marginRight: 10 }} />
                            <Text style={styles(colors).accordionHeaderText}>
                                {new Date(item.EntryDate).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: '2-digit'
                                }).slice(0, 5)}
                            </Text>
                        </View>
                        <View style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignContent: "center"
                        }}>
                            <Text style={{ ...typography.body1(colors), marginLeft: 70, marginRight: 60 }}>{dailyTotal.inward}</Text>
                            <Text style={{ ...typography.body1(colors), marginRight: 30 }}>{dailyTotal.management}</Text>
                            <Text style={{ ...typography.body1(colors), marginRight: 30 }}>{dailyTotal.outward}</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Expanded Content */}
                {isActive && (
                    <View style={styles(colors).accordionContent}>
                        {/* Tabs */}
                        <View style={styles(colors).tabContainer}>
                            {tabData.map(tab => (
                                <TouchableOpacity
                                    key={tab.value}
                                    style={[
                                        styles(colors).tab,
                                        activeTab === tab.value && styles(colors).activeTab
                                    ]}
                                    onPress={() => setActiveTab(tab.value)}
                                >
                                    <Text style={[
                                        styles(colors).tabText,
                                        activeTab === tab.value && styles(colors).activeTabText
                                    ]}>{tab.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

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
        <View style={styles(colors).container}>
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

                <TouchableOpacity
                    style={styles(colors).datePicker}
                    onPress={() => setShowToPicker(true)}
                >
                    <TextInput
                        maxFontSizeMultiplier={1.2}
                        style={styles(colors).textInput}
                        value={`${toDate.getDate().toString().padStart(2, '0')}/${(toDate.getMonth() + 1).toString().padStart(2, '0')}/${toDate.getFullYear()}`}
                        editable={false}
                    />
                    <Icon name="calendar" color={colors.accent} size={20} />
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
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 10 }}>
                <Text style={{ flex: 1, textAlign: "center", ...typography.body1(colors) }}></Text>
                <Text style={{ flex: 1, textAlign: "center", ...typography.body1(colors) }}></Text>
                <Text style={{ flex: 1, textAlign: "center", ...typography.body1(colors) }}>Inwards</Text>
                <Text style={{ flex: 1, textAlign: "center", ...typography.body1(colors) }}>MG</Text>
                <Text style={{ flex: 1, textAlign: "center", ...typography.body1(colors) }}>Outwards</Text>
            </View>

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
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 10,
    },
    userPickContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    datePicker: {
        flex: 3.33,
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.secondary,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 5,
        paddingHorizontal: 5,
    },
    textInput: {
        ...typography.body1(colors),
    },
    dropdown: {
        flex: 3.33,
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
        marginBottom: 10,
        borderWidth: 1,
        borderColor: colors.secondary,
        marginHorizontal: 5,
        borderRadius: 10
    },
    accordionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: colors.card,
        borderRadius: 5,
    },
    accordionView: {
        flexDirection: "row"
    },
    accordionHeaderText: {
        ...typography.body1(colors),
        fontWeight: 'bold',
        color: colors.text,
    },
    dayEntry: {
        flexDirection: "column",
        padding: 10,
        // borderBottomWidth: 1,
        // borderBottomColor: colors.border,
    },
    entryHeader: {
        flexDirection: 'row',
        // alignContent: 'center',
        // alignItems: 'center',
        paddingVertical: 10,
    },
    entryContent: {
        paddingLeft: 20,
    },
    accordionContent: {
        padding: 15,
        backgroundColor: colors.card,
        borderRadius: 5,
        marginTop: 5,
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    tab: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: colors.tabBackground,
    },
    activeTab: {
        backgroundColor: colors.primary,
    },
    tabText: {
        ...typography.body1(colors),
        color: colors.accent,
        fontWeight: 'bold',
    },
    activeTabText: {
        ...typography.body1(colors),
    },
    tableContainer: {
        margin: 10,
        padding: 10,
        backgroundColor: colors.tableBackground,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: colors.tableBorder,
    },
    tableRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        // borderBottomWidth: 1,
        // borderBottomColor: colors.rowBorder,
        paddingVertical: 10,
    },
    tableHeader: {
        flex: 1,
        fontWeight: 'bold',
        color: colors.headerText,
        textAlign: 'center',
    },
    tableCell: {
        flex: 1,
        padding: 5,
        textAlign: 'center',
    },
    tableText: {
        color: colors.cellText,
        textAlign: 'center',
    },
    details: {
        marginTop: 10,
        paddingLeft: 10,
        borderLeftWidth: 2,
        borderLeftColor: colors.accent,
    },
    detailText: {
        color: colors.detailText,
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
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    rowCardTitle: {
        ...typography.body1(colors),
        fontWeight: 'bold',
        marginRight: 10,
    },
    rowCardText: {
        ...typography.body1(colors),
    },
    cardTitle: {
        ...typography.h6(colors),
        fontWeight: '600',
        marginBottom: 10,
    },
    cardText: {
        ...typography.body1(colors),
        fontWeight: '700',
        marginBottom: 15,
    },
})