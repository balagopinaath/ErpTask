import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Animated, Modal, Dimensions } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import ImageViewer from 'react-native-image-zoom-viewer';
import Icon from 'react-native-vector-icons/FontAwesome';
import { PreviewModal } from 'react-native-image-preview-reanimated';
import ImageZoom from 'react-native-image-pan-zoom';

import { api } from '../Constants/api';
import { useThemeContext } from '../Context/ThemeContext';
import { typography } from '../Constants/helper';
import { TouchableWithoutFeedback } from 'react-native';
import { Button } from 'react-native';

const InwardsActivities = () => {
    const { colors, customStyles } = useThemeContext();

    const [organizedData, setOrganizedData] = useState([]);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const dropDownData = [
        { label: "INWARD", value: 1 },
        { label: "MACHINE OUTERN", value: 2 }
    ];
    const [dropDownValue, setDropDownValue] = useState(dropDownData[0].label);

    useEffect(() => {
        getActivities();
    }, [dropDownValue]);

    const getActivities = async () => {
        // console.log(api.inwardActivity)
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
        <View style={customStyles.container}>
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
                <TouchableWithoutFeedback
                    key={index}
                    onPress={() => {
                        setSelectedImageIndex(index);
                        setIsModalOpen(true);
                    }}
                >
                    <View style={styles(colors).imageContainer}>
                        <ImageZoom
                            cropWidth={Dimensions.get('window').width}
                            cropHeight={Dimensions.get('window').height}
                            imageWidth={Dimensions.get('window').width}
                            imageHeight={200}
                        >
                            <Image
                                style={{ width: Dimensions.get('window').width, height: 200 }}
                                source={{ uri: item.url }}
                                resizeMode="cover"
                            />
                        </ImageZoom>
                    </View>
                </TouchableWithoutFeedback>
            ))}

            <Modal visible={isModalOpen} transparent={true} onRequestClose={() => setIsModalOpen(false)}>
                <ImageViewer
                    enablePreload={true}
                    index={selectedImageIndex}
                    imageUrls={imageUrls}
                    useNativeDriver={true}
                    onSwipeDown={() => setIsModalOpen(false)}
                    enableSwipeDown={true}
                    saveToLocalByLongPress={true}
                    enableImageZoom={true}
                />
            </Modal>
        </View>
    )
}

export default InwardsActivities

const styles = (colors) => StyleSheet.create({
    userPickContainer: {
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
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
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
        borderRadius: 8,
        overflow: 'hidden',
    },
    image: {
        width: "100%",
        height: 500,
        borderRadius: 8,
    },
    imageContainerText: {
        ...typography.h6(colors),
        marginLeft: 5,
    }
})