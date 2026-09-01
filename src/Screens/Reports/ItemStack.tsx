import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from "react-native";
import { useTheme } from "../../Context/ThemeContext";
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import AppHeader from "../../Components/AppHeader";
import FilterModal from "../../Components/FilterModal";
import { RootStackParamList } from "../../Navigation/types";
import { responsiveHeight, responsiveWidth } from "../../constants/helper";
import { fetchInStockReport } from "../../Api/reports";
import { storage } from "../../constants/storage";

interface GodownStock {
    godown_id: string;
    godown_name: string;
    parent_godown_name: string;
    IN_Qty: number;
    Out_Qty: number;
    ACt_In_Qty: number;
    ACt_Out_Qty: number;
    OB_Qty: number;
    ACt_OB_Qty: number;
    SOU_In_Qty: number;
    SOU_ACt_In_Qty: number;
    SOU_Out_Qty: number;
    SOU_ACt_Out_Qty: number;
    Process_IN_OUT_Qty: number;
    Process_Act_IN_OUT_Qty: number;
    CL_QTY: number;
    CL_ACt_QTY: number;
}

const ItemStack = () => {
    const navigation =
        useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { colors, typography } = useTheme();
    const styles = getStyles(typography, colors);

    const initialCompanyId = storage.getString("companyId") ?? "";

    const [modalVisible, setModalVisible] = React.useState(false);
    const [fromdate, setFromdate] = React.useState<Date>(new Date());
    const [todate, setTodate] = React.useState<Date>(new Date());
    const [searchText, setSearchText] = React.useState("");

    const { data: inStockReport = [], isLoading, isError, refetch } = useQuery({
        queryKey: ["inStockReport", fromdate, todate, initialCompanyId],
        queryFn: () => fetchInStockReport(fromdate, fromdate, todate, initialCompanyId),
        enabled: !!fromdate && !!todate && !!initialCompanyId,
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 10,
        retry: 1,
    });

    const filtered = React.useMemo(() => {
        if (!inStockReport || inStockReport.length === 0) return [];
        const q = searchText.toLowerCase();
        return (inStockReport as GodownStock[]).filter(g =>
            g.CL_QTY !== 0 && g.godown_name.toLowerCase().includes(q),
        );
    }, [inStockReport, searchText]);

    const totals = React.useMemo(() => {
        return (inStockReport as GodownStock[]).reduce(
            (acc, g) => ({
                ob: acc.ob + g.OB_Qty,
                actOb: acc.actOb + g.ACt_OB_Qty,
                in: acc.in + g.IN_Qty,
                out: acc.out + g.Out_Qty,
                cl: acc.cl + g.CL_QTY,
                actCl: acc.actCl + g.CL_ACt_QTY,
            }),
            { ob: 0, actOb: 0, in: 0, out: 0, cl: 0, actCl: 0 },
        );
    }, [inStockReport]);

    const fmt = (n: number) => {
        if (Math.abs(n) >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
        if (Math.abs(n) >= 100000) return `${(n / 100000).toFixed(1)}L`;
        if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return n.toFixed(0);
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <AppHeader
                title="Item Stock Value"
                navigation={navigation}
                showRightIcon={true}
                rightIconLibrary="MaterialIcon"
                rightIconName="filter-list"
                onRightPress={() => setModalVisible(true)}
            />

            <FilterModal
                visible={modalVisible}
                fromDate={fromdate}
                onFromDateChange={setFromdate}
                showToDate={true}
                toDate={todate}
                onToDateChange={setTodate}
                onApply={() => { refetch(); setModalVisible(false); }}
                onClose={() => setModalVisible(false)}
                title="Filter Options"
            />

            <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}>

                {isLoading && (
                    <View style={styles.centeredState}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.stateText}>Loading stock data...</Text>
                    </View>
                )}

                {!isLoading && isError && (
                    <View style={styles.centeredState}>
                        <Icon name="error-outline" size={48} color={colors.accent} />
                        <Text style={styles.stateText}>Failed to load stock data</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
                            <Icon name="refresh" size={18} color={colors.white} />
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {!isLoading && !isError && inStockReport.length > 0 && (
                    <>
                        {/* Summary row */}
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryVal}>{fmt(totals.ob)}</Text>
                                <Text style={styles.summaryLbl}>Opening</Text>
                            </View>
                            <View style={styles.summaryCard}>
                                <Text style={[styles.summaryVal, { color: colors.success }]}>
                                    {fmt(totals.in)}
                                </Text>
                                <Text style={styles.summaryLbl}>IN</Text>
                            </View>
                            <View style={styles.summaryCard}>
                                <Text style={[styles.summaryVal, { color: colors.accent }]}>
                                    {fmt(totals.out)}
                                </Text>
                                <Text style={styles.summaryLbl}>OUT</Text>
                            </View>
                            <View style={styles.summaryCard}>
                                <Text style={[styles.summaryVal, { color: colors.primary }]}>
                                    {fmt(totals.cl)}
                                </Text>
                                <Text style={styles.summaryLbl}>Closing</Text>
                            </View>
                        </View>

                        {/* Search */}
                        <View style={styles.searchBar}>
                            <Icon name="search" size={20} color={colors.textSecondary} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search godown..."
                                placeholderTextColor={colors.textSecondary}
                                value={searchText}
                                onChangeText={setSearchText}
                            />
                            {searchText.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchText("")}>
                                    <Icon name="clear" size={18} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Godown cards */}
                        <View style={styles.listWrapper}>
                            {filtered.map(godown => {
                                const fmtDate = (d: Date) => d.toISOString().split("T")[0];
                                return (
                                <TouchableOpacity
                                    key={godown.godown_id}
                                    style={styles.card}
                                    activeOpacity={0.75}
                                    onPress={() =>
                                        navigation.navigate("GodownItemWise", {
                                            godownId: godown.godown_id,
                                            godownName: godown.godown_name,
                                            fromDate: fmtDate(fromdate),
                                            toDate: fmtDate(todate),
                                            companyId: initialCompanyId,
                                        })
                                    }>
                                    <View style={styles.cardHeader}>
                                        <View style={styles.cardIconBox}>
                                            <Icon name="warehouse" size={20} color={colors.primary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.cardTitle} numberOfLines={1}>
                                                {godown.godown_name}
                                            </Text>
                                            <Text style={styles.cardSubtitle} numberOfLines={1}>
                                                {godown.parent_godown_name.replace(/^\u0004\s*/, "")}
                                            </Text>
                                        </View>
                                        <Icon name="chevron-right" size={20} color={colors.textSecondary} />
                                    </View>

                                    <View style={styles.statsGrid}>
                                        <View style={styles.statCell}>
                                            <Text style={styles.statLabel}>Opening</Text>
                                            <Text style={styles.statValue}>{fmt(godown.OB_Qty)}</Text>
                                            <Text style={styles.statActual}>Act: {fmt(godown.ACt_OB_Qty)}</Text>
                                        </View>
                                        <View style={[styles.statCell, styles.statCellBorder]}>
                                            <Text style={styles.statLabel}>IN</Text>
                                            <Text style={[styles.statValue, { color: colors.success }]}>
                                                {fmt(godown.IN_Qty)}
                                            </Text>
                                            <Text style={styles.statActual}>Act: {fmt(godown.ACt_In_Qty)}</Text>
                                        </View>
                                        <View style={[styles.statCell, styles.statCellBorder]}>
                                            <Text style={styles.statLabel}>OUT</Text>
                                            <Text style={[styles.statValue, { color: colors.accent }]}>
                                                {fmt(godown.Out_Qty)}
                                            </Text>
                                            <Text style={styles.statActual}>Act: {fmt(godown.ACt_Out_Qty)}</Text>
                                        </View>
                                        <View style={[styles.statCell, styles.statCellBorder]}>
                                            <Text style={styles.statLabel}>Closing</Text>
                                            <Text style={[styles.statValue, { color: colors.primary }]}>
                                                {fmt(godown.CL_QTY)}
                                            </Text>
                                            <Text style={styles.statActual}>Act: {fmt(godown.CL_ACt_QTY)}</Text>
                                        </View>
                                    </View>

                                    {(godown.SOU_Out_Qty !== 0 || godown.Process_IN_OUT_Qty !== 0) && (
                                        <View style={styles.extraRow}>
                                            {godown.SOU_Out_Qty !== 0 && (
                                                <View style={styles.extraItem}>
                                                    <Text style={styles.extraLabel}>In</Text>
                                                    <Text style={styles.extraValue}>{fmt(godown.IN_Qty)}</Text>
                                                </View>
                                            )}
                                            {godown.Process_IN_OUT_Qty !== 0 && (
                                                <View style={styles.extraItem}>
                                                    <Text style={styles.extraLabel}>Process</Text>
                                                    <Text style={styles.extraValue}>{fmt(godown.Process_IN_OUT_Qty)}</Text>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </TouchableOpacity>
                                );
                            })}

                            {filtered.length === 0 && (
                                <View style={styles.centeredState}>
                                    <Icon name="inbox" size={48} color={colors.textSecondary} />
                                    <Text style={styles.stateText}>No godowns match your search</Text>
                                </View>
                            )}
                        </View>
                    </>
                )}

                {!isLoading && !isError && inStockReport.length === 0 && (
                    <View style={styles.centeredState}>
                        <Icon name="inbox" size={48} color={colors.textSecondary} />
                        <Text style={styles.stateText}>No data for selected dates</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default ItemStack;

const getStyles = (typography: any, colors: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.primary,
        },
        scroll: {
            flex: 1,
            backgroundColor: colors.background,
        },
        centeredState: {
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: responsiveHeight(8),
            gap: responsiveHeight(1.5),
        },
        stateText: {
            ...typography.body1,
            color: colors.textSecondary,
            textAlign: "center",
        },
        retryBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: colors.primary,
            paddingHorizontal: responsiveWidth(5),
            paddingVertical: responsiveHeight(1.2),
            borderRadius: 8,
        },
        retryText: {
            ...typography.body2,
            color: colors.white,
            fontWeight: "600",
        },
        summaryRow: {
            flexDirection: "row",
            backgroundColor: colors.white,
            paddingHorizontal: responsiveWidth(3),
            paddingVertical: responsiveHeight(1.8),
            borderBottomWidth: 1,
            borderBottomColor: colors.border ?? "#E5E7EB",
            gap: responsiveWidth(2),
        },
        summaryCard: {
            flex: 1,
            alignItems: "center",
            backgroundColor: colors.surface ?? colors.background,
            borderRadius: 10,
            paddingVertical: responsiveHeight(1.2),
        },
        summaryVal: {
            ...typography.h6,
            color: colors.text,
            fontWeight: "700",
        },
        summaryLbl: {
            ...typography.caption,
            color: colors.textSecondary,
            marginTop: 2,
        },
        searchBar: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.white,
            marginHorizontal: responsiveWidth(4),
            marginVertical: responsiveHeight(1),
            paddingHorizontal: responsiveWidth(3),
            paddingVertical: responsiveHeight(1),
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border ?? "#E5E7EB",
            gap: responsiveWidth(2),
        },
        searchInput: {
            flex: 1,
            ...typography.body2,
            color: colors.text,
        },
        listWrapper: {
            paddingHorizontal: responsiveWidth(4),
            paddingBottom: responsiveHeight(3),
            gap: responsiveHeight(1.2),
        },
        card: {
            backgroundColor: colors.white,
            borderRadius: 12,
            overflow: "hidden",
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.07,
            shadowRadius: 4,
            elevation: 2,
        },
        cardHeader: {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: responsiveWidth(3.5),
            paddingVertical: responsiveHeight(1.4),
            borderBottomWidth: 1,
            borderBottomColor: colors.border ?? "#F3F4F6",
            gap: responsiveWidth(2.5),
        },
        cardIconBox: {
            width: responsiveWidth(10),
            height: responsiveWidth(10),
            borderRadius: 8,
            backgroundColor: colors.primary + "12",
            alignItems: "center",
            justifyContent: "center",
        },
        cardTitle: {
            ...typography.body1,
            color: colors.text,
            fontWeight: "700",
        },
        cardSubtitle: {
            ...typography.caption,
            color: colors.textSecondary,
            marginTop: 2,
        },
        statsGrid: {
            flexDirection: "row",
            paddingHorizontal: responsiveWidth(2),
            paddingVertical: responsiveHeight(1.2),
        },
        statCell: {
            flex: 1,
            alignItems: "center",
            paddingVertical: responsiveHeight(0.5),
        },
        statCellBorder: {
            borderLeftWidth: 1,
            borderLeftColor: colors.border ?? "#F3F4F6",
        },
        statLabel: {
            ...typography.caption,
            color: colors.textSecondary,
            marginBottom: 3,
            fontSize: 10,
        },
        statValue: {
            ...typography.body2,
            color: colors.text,
            fontWeight: "700",
        },
        statActual: {
            fontSize: 10,
            color: colors.textSecondary,
            marginTop: 2,
        },
        extraRow: {
            flexDirection: "row",
            backgroundColor: colors.surface ?? colors.background,
            paddingHorizontal: responsiveWidth(3.5),
            paddingVertical: responsiveHeight(0.8),
            borderTopWidth: 1,
            borderTopColor: colors.border ?? "#F3F4F6",
            gap: responsiveWidth(4),
        },
        extraItem: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
        },
        extraLabel: {
            ...typography.caption,
            color: colors.textSecondary,
        },
        extraValue: {
            ...typography.caption,
            color: colors.text,
            fontWeight: "600",
        },
    });
