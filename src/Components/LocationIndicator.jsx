import {
    PermissionsAndroid,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
    useColorScheme
} from 'react-native';
import React, { useEffect, useState } from 'react';
import Geolocation from '@react-native-community/geolocation';
import { customColors, typography } from '../Constants/helper';

const LocationIndicator = ({ onLocationUpdate }) => {
    const scheme = useColorScheme();
    const colors = customColors[scheme === 'dark' ? 'dark' : 'light'];
    const [currentLocation, setCurrentLocation] = useState({
        latitude: '',
        longitude: ''
    });
    const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
    const [locationEnabled, setLocationEnabled] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [fetchButton, setFetchButton] = useState(true);

    useEffect(() => {
        const checkPermission = async () => {
            const granted = await PermissionsAndroid.check(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );
            setLocationPermissionGranted(granted);
            return granted;
        };

        const checkLocationStatus = () => {
            Geolocation.getCurrentPosition(
                (position) => {
                    setLocationEnabled(true);
                    const { latitude, longitude } = position.coords;
                    setCurrentLocation({ latitude, longitude });
                    if (onLocationUpdate) {
                        onLocationUpdate({ latitude, longitude });
                    }
                },
                (error) => {
                    setLocationEnabled(false);
                    console.error('Error getting location:', error);
                }
            );
        };

        const initializeLocation = async () => {
            const granted = await checkPermission();
            if (granted) {
                checkLocationStatus();
            } else {
                Alert.alert(
                    'Location Permission',
                    'Location permission denied. App cannot function properly without it.'
                );
            }
        };

        const getLocationPermission = async () => {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: 'Sales App Location Permission',
                        message: 'Sales App needs access to your location',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK'
                    }
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    setLocationPermissionGranted(true);
                    checkLocationStatus();
                } else {
                    console.log('Location permission denied');
                    setLocationEnabled(false);
                    Alert.alert(
                        'Location Permission',
                        'Location permission denied. App cannot function properly without it.'
                    );
                }
            } catch (err) {
                console.warn(err);
            }
        };

        if (!locationPermissionGranted || refresh) {
            getLocationPermission();
        }
    }, [locationPermissionGranted, refresh, onLocationUpdate]);

    const fetchEvent = () => {
        setFetchButton(!fetchButton);
        setRefresh(!refresh);
    };

    const refreshLocation = () => {
        setCurrentLocation({ latitude: '', longitude: '' });
        setLocationEnabled(false);
    };

    return (
        <View style={styles(colors).card}>
            <Text style={styles(colors).cardTitle}>Location Status</Text>
            <View style={styles(colors).cardContent}>
                <View style={styles(colors).row}>
                    <View style={styles(colors).dotContainer}>
                        <View
                            style={
                                locationPermissionGranted ? styles(colors).activeDot : styles(colors).inactiveDot
                            }
                        />
                        <Text style={styles(colors).dotLabel}>Permission</Text>
                    </View>
                    <View style={styles(colors).dotContainer}>
                        <View style={locationEnabled ? styles(colors).activeDot : styles(colors).inactiveDot} />
                        <Text style={styles(colors).dotLabel}>Location</Text>
                    </View>
                    <View style={styles(colors).dotContainer}>
                        <View
                            style={
                                currentLocation.latitude && currentLocation.longitude
                                    ? styles(colors).activeDot
                                    : styles(colors).inactiveDot
                            }
                        />
                        <Text style={styles(colors).dotLabel}>Position</Text>
                    </View>
                </View>
                <View style={styles(colors).buttonGroup}>
                    <TouchableOpacity onPress={refreshLocation} style={styles(colors).button}>
                        <Text style={styles(colors).buttonText}>Refresh Status</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={fetchEvent} style={styles(colors).button}>
                        <Text style={styles(colors).buttonText}>Fetch Location</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default LocationIndicator;

const styles = (colors) =>
    StyleSheet.create({
        card: {
            width: "90%",
            alignSelf: 'center',
            backgroundColor: colors.background === '#000000' ? colors.black : colors.white,
            borderRadius: 10,
            padding: 15,
            shadowColor: colors.background === "#000000" ? colors.white : colors.black,
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.22,
            shadowRadius: 2.22,
            elevation: 2,
            marginVertical: 10,
            marginHorizontal: 20
        },
        cardTitle: {
            ...typography.body1(colors),
            fontWeight: 'bold',
            marginBottom: 10,
            borderBottomWidth: 1,
            borderBottomColor: '#ccc',
            borderStyle: 'dashed',
            paddingBottom: 5
        },
        cardContent: {
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'stretch'
        },
        row: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10
        },
        dotContainer: {
            flexDirection: 'row',
            alignItems: 'center'
        },
        activeDot: {
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: '#DAF7A6',
            marginRight: 5,
            marginBottom: 4
        },
        inactiveDot: {
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: '#FF5733',
            marginRight: 5,
            marginBottom: 4
        },
        dotLabel: {
            ...typography.body2(colors),
            textAlign: 'center'
        },
        buttonGroup: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 10
        },
        button: {
            borderWidth: 0.5,
            padding: 5,
            borderColor: colors.accent,
            borderRadius: 5,
            marginHorizontal: 5,
            alignItems: 'center'
        },
        buttonText: {
            ...typography.body1(colors),
            fontWeight: '500',
            color: colors.text
        }
    });
