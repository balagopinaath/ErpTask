import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Animated, Modal, Dimensions, Linking } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import ImageViewer from 'react-native-image-zoom-viewer';
import Icon from 'react-native-vector-icons/FontAwesome';
import { PreviewModal } from 'react-native-image-preview-reanimated';
import ImageZoom from 'react-native-image-pan-zoom';

// import WebView from 'react-native-webview';
import WebView from 'react-native-webview';

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
        console.log(api.inwardActivity)
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

    const openInBrowser = (url) => {
        Linking.openURL(url).catch((err) => console.error('An error occurred', err));
    };

    const renderImageItems = () => {
        return organizedData.map((item, index) => (
            <TouchableOpacity key={index} onPress={() => setIsModalOpen(true)}>
                <View style={styles.imageContainer}>
                    <WebView
                        source={{ uri: item.url }}
                        style={styles.webViewStyle}
                        originWhitelist={['*']}
                        allowsFullscreenVideo={true}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        scalesPageToFit={true}
                    />
                </View>
            </TouchableOpacity>
        ));
    };


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


            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {organizedData.map((item, index) => (
                    <View key={index} style={styles(colors).imageContainer}>
                        <WebView
                            source={{ uri: item.url }}
                            style={{ width: Dimensions.get('window').width, height: 500 }}
                            originWhitelist={['*']}
                            allowsFullscreenVideo={true}
                            javaScriptEnabled={true}
                            // domStorageEnabled={true}
                            // scalesPageToFit={true}
                            scrollEnabled={true} // Enable WebView scrolling
                        />
                    </View>
                ))}
            </ScrollView>

            <Modal visible={isModalOpen} transparent={true} onRequestClose={() => setIsModalOpen(false)}>
                <View style={{ flex: 1, backgroundColor: 'black' }}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setIsModalOpen(false)}>
                        <WebView
                            source={{ uri: organizedData[selectedImageIndex]?.url }}
                            // style={{ flex: 1 }}
                            useWebKit={true} // Enable WebKit for pinch zoom support
                            allowsFullscreenVideo={true} // Allow fullscreen video
                            javaScriptEnabled={true} // Enable JavaScript in WebView
                        />
                    </TouchableOpacity>
                </View>
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
        width: Dimensions.get('window').width, // Adjust width as needed
        height: 580, // Fixed height or adjust as needed
        paddingHorizontal: 10,
    },
    imageContainerText: {
        ...typography.h6(colors),
        marginLeft: 5,
    }
})