import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import ImageViewer from 'react-native-image-zoom-viewer';
import Icon from 'react-native-vector-icons/FontAwesome';

import { api } from '../Constants/api';
import { useThemeContext } from '../Context/ThemeContext';
import { typography } from '../Constants/helper';

const InwardsActivities = () => {
    const { colors, customStyles } = useThemeContext();

    const [organizedData, setOrganizedData] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const dropDownData = [
        { label: "INWARD", value: 1 },
        { label: "MACHINE OUTERN", value: 2 }
    ];
    const [dropDownValue, setDropDownValue] = useState(dropDownData[0].label);

    useEffect(() => {
        getActivities();
    }, [dropDownValue]);

    const getActivities = async () => {
        try {
            let response
            if (dropDownValue === "INWARD") {
                response = await fetch(api.inwardActivity);
            } else if (dropDownValue === "MACHINE OUTERN") {
                response = await fetch(api.machineOutern);
            }

            const jsonData = await response.json();

            if (jsonData.success) {
                setOrganizedData(jsonData.data);
            }
        } catch (err) {
            console.log("Error fetching data:", err);
        }
    };

    const imageUrls = organizedData.map(item => ({
        url: item.url,
    }));


    return (
        <View style={styles(colors).container}>
            <View style={styles(colors).userPickContainer}>
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

                {organizedData.map((item, index) => (
                    <View key={index} style={{ flexDirection: "row", marginTop: 15, }}>
                        <Icon name='clock-o' size={20} color={colors.accent} style={{ marginTop: 2.5 }} />
                        <Text style={styles(colors).imageContainerText}>
                            Updated at: {new Date(item.modifiedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                ))}
            </View>

            {organizedData.map((item, index) => (
                <ScrollView>
                    <TouchableOpacity
                        key={index}
                        style={styles(colors).imageContainer}
                        onPress={() => {
                            setSelectedImageIndex(index);
                            setModalVisible(true);
                        }}
                    >
                        <Image
                            source={{ uri: item.url }}
                            width={"100%"}
                            height={550}
                            resizeMode='contain'
                        />
                    </TouchableOpacity>
                </ScrollView>
            ))}

            <Modal visible={modalVisible} transparent={true} onRequestClose={() => setModalVisible(false)}>
                <ImageViewer imageUrls={imageUrls} index={selectedImageIndex} />
            </Modal>

        </View>
    )
}

export default InwardsActivities

const styles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 10,
    },
    userPickContainer: {
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    dropdown: {
        width: "60%",
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
    imageContainer: {
        alignItems: "center",
        marginVertical: 20
    },
    imageContainerText: {
        ...typography.h6(colors),
        marginLeft: 5,
    }
})