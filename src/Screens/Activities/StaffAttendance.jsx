// import React, { useEffect, useState } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Image, ScrollView, Dimensions } from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import { Dropdown } from 'react-native-element-dropdown';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

// import { useThemeContext } from '../Context/ThemeContext';
// import { api } from '../Constants/api';
// import { typography } from '../Constants/helper';

// import Icon from 'react-native-vector-icons/FontAwesome';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import FontistoIcons from 'react-native-vector-icons/Fontisto';

// const StaffAttendance = () => {
//     const { colors, customStyles } = useThemeContext();
//     const [data, setData] = useState([]);
//     const [total, setTotal] = useState([]);

//     const currentDate = new Date();
//     const [fromDate, setFromDate] = useState(currentDate);
//     const [toDate, setToDate] = useState(currentDate);
//     const [showFromPicker, setShowFromPicker] = useState(false);

//     const dropDownData = [
//         { label: "MILL", value: 1 },
//         { label: "GODOWN", value: 2 }
//     ];
//     const [dropDownValue, setDropDownValue] = useState(dropDownData[0].label);

//     useEffect(() => {
//         getStaffAttendance(fromDate.toISOString(), toDate.toISOString(), dropDownValue);
//     }, [fromDate, toDate, dropDownValue]);

//     const getStaffAttendance = async (from, to, dropValue) => {
//         try {
//             const response = await fetch(api.getStaffAttendance(from, to, dropValue));
//             const jsonData = await response.json();
//             if (jsonData.success && jsonData.data) {
//                 setData(jsonData.data);
//                 const totalCount = calculateOverallTotal(jsonData.data);
//                 setTotal(totalCount);
//             }
//         } catch (err) {
//             console.log("Error fetching data:", err);
//         }
//     }

//     const onFromDateChange = (event, selectedDate) => {
//         const currentDate = selectedDate || fromDate;
//         setShowFromPicker(Platform.OS === 'ios');
//         setFromDate(currentDate);
//         setToDate(currentDate);
//     };

//     const calculateOverallTotal = (data) => {
//         if (!data || data.length === 0) return 0;

//         return data.reduce((total, item) => {
//             return total + item.Categories.reduce((categoryTotal, category) => {
//                 return categoryTotal + category.StaffTypes.reduce((staffTotal, staff) => {
//                     // Ensure StaffCount is a valid number
//                     const count = parseInt(staff.StaffAttendance.StaffCount, 10) || 0;
//                     return staffTotal + count;
//                 }, 0);
//             }, 0);
//         }, 0);
//     }

//     const renderCard = ({ item }) => (
//         <View style={styles(colors).container}>
//             {item.Categories.map((category, index) => {
//                 // Calculate total staff count
//                 const totalStaffCount = category.StaffTypes.reduce((acc, staff) => {
//                     return acc + (staff.StaffAttendance.StaffCount || 0);
//                 }, 0);

//                 return (
//                     <View key={index}>
//                         <Text style={styles(colors).cardTitle}>
//                             {category.WorkDetails}
//                             <Text style={{ color: colors.accent }}>&nbsp;&nbsp;{totalStaffCount}</Text>
//                         </Text>
//                         <View style={styles(colors).card}>
//                             {category.StaffTypes.map((staff, idx) => (
//                                 <View key={idx} style={styles(colors).staffTypeContainer}>
//                                     <MaterialIcons name="people" size={30} color={colors.primary} />
//                                     <Text style={styles(colors).staffCount}>
//                                         {staff.StaffAttendance.StaffCount !== undefined ? ` ${staff.StaffAttendance.StaffCount}` : ''}
//                                     </Text>
//                                     <Text style={styles(colors).staffTypeTitle} numberOfLines={2}>
//                                         {staff.StaffType}
//                                     </Text>
//                                 </View>
//                             ))}
//                         </View>
//                     </View>
//                 );
//             })}
//         </View>
//     );

//     return (
//         <View style={styles(colors).container}>
//             <View style={styles(colors).userPickContainer}>
//                 <TouchableOpacity
//                     style={styles(colors).datePicker}
//                     onPress={() => setShowFromPicker(true)}
//                 >
//                     <FontistoIcons name="date" color={colors.accent} size={20} />
//                     <TextInput
//                         maxFontSizeMultiplier={1.2}
//                         style={styles(colors).textInput}
//                         value={`${fromDate.getDate().toString().padStart(2, '0')}/${(fromDate.getMonth() + 1).toString().padStart(2, '0')}/${fromDate.getFullYear()}`}
//                         editable={false}
//                     />
//                     {showFromPicker && (
//                         <DateTimePicker
//                             testID="toDatePicker"
//                             is24Hour={true}
//                             value={fromDate}
//                             mode="date"
//                             display="default"
//                             onChange={onFromDateChange}
//                         />
//                     )}
//                 </TouchableOpacity>

//                 <Dropdown
//                     data={dropDownData}
//                     value={dropDownValue}
//                     labelField="label"
//                     valueField="label"
//                     placeholder="Select Location"
//                     renderLeftIcon={() => (
//                         <FontistoIcons name="map-marker-alt"
//                             color={colors.accent} size={20}
//                             style={{ marginRight: 10, }}
//                         />
//                     )}
//                     onChange={item => {
//                         setDropDownValue(item.label);
//                     }}
//                     maxHeight={300}
//                     style={styles(colors).dropdown}
//                     placeholderStyle={styles(colors).placeholderStyle}
//                     containerStyle={styles(colors).dropdownContainer}
//                     selectedTextStyle={styles(colors).selectedTextStyle}
//                     iconStyle={styles(colors).iconStyle}
//                 />
//             </View>

//             <View style={styles(colors).overallTotalContainer}>
//                 <Text style={styles(colors).overallTotalText}>
//                     Total Count <Text style={{ color: colors.accent }}>{total}</Text>
//                 </Text>
//             </View>

//             <FlatList
//                 data={data}
//                 keyExtractor={(item, index) => String(index)}
//                 renderItem={renderCard}
//                 ListEmptyComponent={() => (
//                     <View style={customStyles.noDataContainer}>
//                         <Text style={customStyles.noDataText}>No display to show!</Text>
//                     </View>
//                 )}
//             />

//         </View>
//     )
// }

// export default StaffAttendance

// const styles = (colors) => StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: colors.background,
//         padding: 10,
//     },
//     userPickContainer: {
//         padding: 10,
//         flexDirection: "row",
//         justifyContent: "space-evenly",
//         marginBottom: 20,
//     },

//     datePicker: {
//         width: "45%",
//         height: 50,
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: colors.secondary,
//         borderWidth: 1,
//         borderColor: colors.grey,
//         borderRadius: 5,
//         paddingHorizontal: 10,
//     },
//     textInput: {
//         textAlign: "center",
//         ...typography.body1(colors),
//         marginLeft: 5,
//         marginTop: 5
//     },
//     dropdown: {
//         width: "45%",
//         height: 50,
//         borderColor: colors.grey,
//         borderWidth: 1,
//         borderRadius: 5,
//         paddingHorizontal: 10,
//         backgroundColor: colors.secondary,
//     },
//     dropdownContainer: {
//         backgroundColor: colors.secondary,
//         borderColor: colors.textPrimary,
//         borderWidth: 0.5,
//         borderRadius: 10,
//     },
//     placeholderStyle: {
//         ...typography.body1(colors),
//     },
//     selectedTextStyle: {
//         ...typography.body1(colors),
//     },
//     iconStyle: {
//         width: 25,
//         height: 25,
//     },

//     overallTotalContainer: {
//         justifyContent: "flex-end",
//         alignItems: "flex-end",
//         marginRight: 10
//     },
//     overallTotalText: {
//         ...typography.h5(colors),
//         fontWeight: "bold"
//     },

//     card: {
//         flexDirection: "row",
//         backgroundColor: colors.background,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//         elevation: 3,
//         borderRadius: 10,
//         marginBottom: 20,
//     },
//     cardTitle: {
//         ...typography.h5(colors),
//         fontWeight: "bold",
//         marginBottom: 20,
//     },
//     staffTypeContainer: {
//         alignItems: "center",
//         paddingVertical: 15,
//         marginVertical: 5,
//         // borderWidth: 1,
//         // borderColor: colors.border,
//     },
//     staffCount: {
//         ...typography.h5(colors),
//         color: colors.accent,
//         fontWeight: "bold"
//         // marginLeft: 5,
//     },
//     staffTypeTitle: {
//         textAlign: "center",
//         width: "90%",
//         flexShrink: 1,
//         flexWrap: "wrap",
//         ...typography.h5(colors),
//         marginLeft: 10,
//     },
// })

import { StyleSheet, Text, View } from "react-native";
import React from "react";

const StaffAttendance = () => {
    return (
        <View>
            <Text>StaffAttendance</Text>
        </View>
    );
};

export default StaffAttendance;

const styles = StyleSheet.create({});
