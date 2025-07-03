import {
    ScrollView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    RefreshControl,
} from "react-native";
import React from "react";
import { MMKV } from "react-native-mmkv";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../../Context/ThemeContext";
import AppHeader from "../../Components/AppHeader";
import { RootStackParamList } from "../../Navigation/types";
import { responsiveHeight, responsiveWidth } from "../../constants/helper";
import DatePickerButton from "../../Components/DatePickerButton";
import { useQuery } from "@tanstack/react-query";
import { dashBoardData, dashBoardDayBook } from "../../Api/Dashboard";

const Home = () => {
    const { colors, typography } = useTheme();
    const styles = getStyles(typography, colors);
    const storage = new MMKV();
    const navigation =
        useNavigation<NativeStackScreenProps<RootStackParamList>>();

    const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
    const [refreshing, setRefreshing] = React.useState(false);

    // Module icons configuration for React Native
    const getModuleIcon = (actualName: string) => {
        const iconMap: {
            [key: string]: {
                name: string;
                library: "MaterialIcons" | "MaterialCommunityIcons";
                color: string;
            };
        } = {
            STOCKVALUE: {
                name: "inventory-2",
                library: "MaterialIcons",
                color: "#2196F3",
            },
            SaleOrder: {
                name: "assignment",
                library: "MaterialIcons",
                color: "#4CAF50",
            },
            SalesInvoice: {
                name: "receipt-long",
                library: "MaterialIcons",
                color: "#FF9800",
            },
            PurchaseOrder: {
                name: "assignment-turned-in",
                library: "MaterialIcons",
                color: "#9C27B0",
            },
            PurchaseInvoice: {
                name: "request-quote",
                library: "MaterialIcons",
                color: "#F44336",
            },
            EXPENCES: {
                name: "hand-coin",
                library: "MaterialCommunityIcons",
                color: "#E91E63",
            },
            Payment: {
                name: "payments",
                library: "MaterialIcons",
                color: "#3F51B5",
            },
            Receipt: {
                name: "attach-money",
                library: "MaterialIcons",
                color: "#009688",
            },
            Journal: {
                name: "menu-book",
                library: "MaterialIcons",
                color: "#795548",
            },
            StockJournal: {
                name: "inventory",
                library: "MaterialIcons",
                color: "#607D8B",
            },
            Contra: {
                name: "compare-arrows",
                library: "MaterialIcons",
                color: "#FF5722",
            },
        };
        return (
            iconMap[actualName] || {
                name: "help",
                library: "MaterialIcons",
                color: colors.textSecondary,
            }
        );
    };

    const moduleIcons = [
        { actualName: "STOCKVALUE", str: "STOCK VALUE", orderBy: 1 },
        { actualName: "SaleOrder", str: "SALE ORDER", orderBy: 2 },
        { actualName: "SalesInvoice", str: "SALES INVOICE", orderBy: 3 },
        { actualName: "PurchaseOrder", str: "PURCHASE ORDER", orderBy: 4 },
        { actualName: "PurchaseInvoice", str: "PURCHASE INVOICE", orderBy: 5 },
        { actualName: "EXPENCES", str: "EXPENSES", orderBy: 6 },
        { actualName: "Payment", str: "PAYMENT", orderBy: 7 },
        { actualName: "Receipt", str: "RECEIPT", orderBy: 8 },
        { actualName: "Journal", str: "JOURNAL", orderBy: 9 },
        { actualName: "StockJournal", str: "STOCK JOURNAL", orderBy: 10 },
        { actualName: "Contra", str: "CONTRA", orderBy: 11 },
    ];

    const companyId = storage.getNumber("companyId") || 1;

    const {
        data: dayBookData = [],
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["dashboardDayBook", selectedDate],
        queryFn: () => dashBoardDayBook(selectedDate, selectedDate, companyId),
        enabled: !!selectedDate && companyId !== undefined,
    });

    console.log("dayBookData", dayBookData);

    const { data: otherData = {} } = useQuery({
        queryKey: ["dashboardOtherData", selectedDate],
        queryFn: () => dashBoardData(selectedDate, companyId),
        enabled: !!selectedDate && companyId !== undefined,
        select: data => {
            const EXPENCES = data[1]?.[0]?.Total_Cost_Vlaue;
            const STOCKVALUE = data[0]?.[0]?.Total_Stock_Value;

            return {
                EXPENCES: EXPENCES ? parseFloat(EXPENCES) : 0,
                STOCKVALUE: STOCKVALUE ? parseFloat(STOCKVALUE) : 0,
            };
        },
    });

    console.log("otherData", otherData);

    // Format number for display
    const formatNumber = (num: number) => {
        if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
        if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    // Handle refresh
    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    // Dashboard Card Component
    const DashboardCard = ({
        moduleData,
        iconData,
    }: {
        moduleData: any;
        iconData: any;
    }) => {
        const icon = getModuleIcon(iconData.actualName);
        const IconComponent =
            icon.library === "MaterialIcons" ? Icon : MaterialCommunityIcons;

        // Process grouped data
        const grouped = moduleData?.groupedData || [];
        const erpData = grouped.filter((mod: any) => mod.dataSource === "ERP");
        const tallyData = grouped.filter(
            (mod: any) => mod.dataSource === "TALLY",
        );

        const erpTotal = erpData.reduce(
            (acc: number, item: any) => acc + (item?.Amount || 0),
            0,
        );
        const erpCount = erpData.reduce(
            (acc: number, item: any) => acc + (item?.VoucherBreakUpCount || 0),
            0,
        );
        const tallyTotal = tallyData.reduce(
            (acc: number, item: any) => acc + (item?.Amount || 0),
            0,
        );
        const tallyCount = tallyData.reduce(
            (acc: number, item: any) => acc + (item?.VoucherBreakUpCount || 0),
            0,
        );

        return (
            <TouchableOpacity
                style={[styles.dashboardCard, { borderLeftColor: icon.color }]}
                activeOpacity={0.7}>
                <View style={styles.cardContent}>
                    <View style={styles.cardLeft}>
                        <Text style={styles.cardTitle}>{iconData.str}</Text>

                        {/* ERP Data Row */}
                        <View style={styles.dataRow}>
                            <Text style={styles.dataLabel}>ERP</Text>
                            <View style={styles.dataValues}>
                                <Text style={styles.dataAmount}>
                                    {formatNumber(erpTotal)}
                                </Text>
                                <Text style={styles.dataCount}>
                                    / {erpCount}
                                </Text>
                            </View>
                        </View>

                        {/* Tally Data Row */}
                        <View style={styles.dataRow}>
                            <Text style={styles.dataLabel}>TALLY</Text>
                            <View style={styles.dataValues}>
                                <Text style={styles.dataAmount}>
                                    {formatNumber(tallyTotal)}
                                </Text>
                                <Text style={styles.dataCount}>
                                    / {tallyCount}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Icon */}
                    <View
                        style={[
                            styles.cardIcon,
                            { backgroundColor: icon.color + "20" },
                        ]}>
                        <IconComponent
                            name={icon.name}
                            size={32}
                            color={icon.color}
                        />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader
                navigation={navigation}
                showDrawer={true}
                name={storage.getString("name")}
                subtitle={storage.getString("companyName")}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                    />
                }>
                {/* Date Picker Section */}
                <View style={styles.datePickerContainer}>
                    <Text style={styles.sectionTitle}>Dashboard Overview</Text>
                    <View style={styles.datePickerRow}>
                        <DatePickerButton
                            title="Select Date"
                            date={selectedDate}
                            style={styles.datePicker}
                            containerStyle={styles.datePickerContainerStyle}
                            titleStyle={styles.datePickerTitle}
                            onDateChange={(date: Date) => setSelectedDate(date)}
                        />
                        <TouchableOpacity
                            style={styles.refreshButton}
                            onPress={onRefresh}>
                            <Icon
                                name="refresh"
                                size={24}
                                color={colors.white}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Loading State */}
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>
                            Loading dashboard data...
                        </Text>
                    </View>
                )}

                {/* Summary Section */}
                <View style={styles.summarySection}>
                    <Text style={styles.sectionTitle}>Quick Summary</Text>
                    <View style={styles.summaryCards}>
                        <View style={styles.summaryCard}>
                            <Icon
                                name="trending-up"
                                size={24}
                                color={colors.primary}
                            />
                            <Text style={styles.summaryCardTitle}>
                                Total Stock Value
                            </Text>
                            <Text style={styles.summaryCardValue}>
                                ₹
                                {formatNumber(
                                    (otherData as any).STOCKVALUE || 0,
                                )}
                            </Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Icon
                                name="trending-down"
                                size={24}
                                color={colors.accent}
                            />
                            <Text style={styles.summaryCardTitle}>
                                Total Expenses
                            </Text>
                            <Text style={styles.summaryCardValue}>
                                ₹
                                {formatNumber((otherData as any).EXPENCES || 0)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Dashboard Cards Grid */}
                <View style={styles.dashboardGrid}>
                    {moduleIcons.map((iconData, index) => {
                        // Find corresponding data or create default structure
                        const moduleData =
                            iconData.actualName === "EXPENCES" ||
                            iconData.actualName === "STOCKVALUE"
                                ? {
                                      ModuleName: iconData.actualName,
                                      groupedData: [
                                          {
                                              VoucherBreakUpCount: 0,
                                              Voucher_Type: "",
                                              ModuleName: iconData.actualName,
                                              Amount:
                                                  (otherData as any)[
                                                      iconData.actualName
                                                  ] || 0,
                                              navLink: "",
                                              dataSource: "TALLY",
                                          },
                                      ],
                                  }
                                : dayBookData.find(
                                      (entry: any) =>
                                          entry.ModuleName ===
                                          iconData.actualName,
                                  ) || {
                                      ModuleName: iconData.actualName,
                                      groupedData: [],
                                  };

                        return (
                            <DashboardCard
                                key={iconData.actualName}
                                moduleData={moduleData}
                                iconData={iconData}
                            />
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Home;

const getStyles = (typography: any, colors: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },

        // Date Picker Section
        datePickerContainer: {
            padding: responsiveWidth(4),
            backgroundColor: colors.white,
            borderRadius: 12,
            margin: responsiveWidth(4),
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        sectionTitle: {
            ...typography.h6,
            color: colors.text,
            fontWeight: "600",
            marginBottom: responsiveHeight(2),
        },
        datePickerRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: responsiveWidth(3),
        },
        datePickerContainerStyle: {
            flex: 1,
        },
        datePickerTitle: {
            ...typography.body1,
            color: colors.text,
            marginBottom: 8,
        },
        datePicker: {
            backgroundColor: colors.primary + "30",
            padding: responsiveWidth(3),
            borderRadius: 8,
            alignItems: "center",
        },
        refreshButton: {
            backgroundColor: colors.primary,
            padding: responsiveWidth(3),
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            minWidth: responsiveWidth(12),
            minHeight: responsiveWidth(12),
        },

        // Loading State
        loadingContainer: {
            alignItems: "center",
            justifyContent: "center",
            padding: responsiveHeight(4),
        },
        loadingText: {
            ...typography.body1,
            color: colors.textSecondary,
        },

        // Dashboard Grid
        dashboardGrid: {
            paddingHorizontal: responsiveWidth(4),
            paddingBottom: responsiveHeight(2),
        },

        // Dashboard Cards
        dashboardCard: {
            backgroundColor: colors.white,
            borderRadius: 12,
            marginBottom: responsiveHeight(2),
            borderLeftWidth: 4,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            overflow: "hidden",
        },
        cardContent: {
            flexDirection: "row",
            alignItems: "center",
            padding: responsiveWidth(4),
        },
        cardLeft: {
            flex: 1,
            marginRight: responsiveWidth(3),
        },
        cardTitle: {
            ...typography.h6,
            color: colors.text,
            fontWeight: "600",
            marginBottom: responsiveWidth(2),
            fontSize: responsiveWidth(4),
        },
        cardIcon: {
            width: responsiveWidth(15),
            height: responsiveWidth(15),
            borderRadius: responsiveWidth(7.5),
            alignItems: "center",
            justifyContent: "center",
        },

        // Data Rows
        dataRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: responsiveWidth(1.5),
        },
        dataLabel: {
            ...typography.body2,
            color: colors.textSecondary,
            fontWeight: "500",
            minWidth: responsiveWidth(12),
        },
        dataValues: {
            flexDirection: "row",
            alignItems: "baseline",
            gap: responsiveWidth(1),
        },
        dataAmount: {
            ...typography.h6,
            color: colors.text,
            fontWeight: "700",
        },
        dataCount: {
            ...typography.caption,
            color: colors.textSecondary,
        },

        // Summary Section
        summarySection: {
            paddingHorizontal: responsiveWidth(4),
            paddingVertical: responsiveHeight(2),
        },
        summaryCards: {
            flexDirection: "row",
            gap: responsiveWidth(3),
        },
        summaryCard: {
            flex: 1,
            backgroundColor: colors.white,
            borderRadius: 12,
            padding: responsiveWidth(4),
            alignItems: "center",
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        summaryCardTitle: {
            ...typography.body2,
            color: colors.textSecondary,
            textAlign: "center",
            marginVertical: responsiveWidth(2),
        },
        summaryCardValue: {
            ...typography.h5,
            color: colors.text,
            fontWeight: "700",
            textAlign: "center",
        },
    });
