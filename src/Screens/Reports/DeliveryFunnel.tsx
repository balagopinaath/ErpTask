import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import AppHeader from "../../Components/AppHeader";
import EnhancedDropdown from "../../Components/EnhancedDropdown";
import FilterModal from "../../Components/FilterModal";
import { RootStackParamList } from "../../Navigation/types";
import { responsiveHeight, responsiveWidth } from "../../constants/helper";
import { storage } from "../../constants/storage";
import { useTheme } from "../../Context/ThemeContext";
import {
    fetchDeliveryFunnel,
    fetchDeliveryFunnelDayWise,
    fetchGodown,
} from "../../Api/reports";

type StageKey =
    | "SalesOrder"
    | "SalesInvoice"
    | "Printed"
    | "Taken"
    | "Check"
    | "Delivery"
    | "Dispatch"
    | "ShedSheet";

interface FunnelRow {
    Metric: string;
    Godown_Id: number | null;
    Godown_Name: string;
    SalesOrder: string;
    SalesInvoice: string;
    Printed: string;
    Taken: string;
    Check: string;
    Dispatch: string;
    Delivery: string;
    ShedSheet: string;
}

interface FunnelDayRow extends FunnelRow {
    ReportDate: string;
}

interface GodownOption {
    godown_id: string;
    godown_name: string;
}

type ViewMode = "abstract" | "expanded";

const FUNNEL_STAGES: { key: StageKey; label: string; icon: string }[] = [
    { key: "SalesOrder", label: "Sales Order", icon: "shopping-cart" },
    { key: "SalesInvoice", label: "Sales Invoice", icon: "receipt" },
    { key: "Printed", label: "Printed", icon: "print" },
    { key: "Taken", label: "Taken", icon: "pan-tool" },
    { key: "Check", label: "Check", icon: "fact-check" },
    { key: "Delivery", label: "Delivery", icon: "local-shipping" },
    { key: "Dispatch", label: "Dispatch", icon: "send" },
    { key: "ShedSheet", label: "Shed Sheet", icon: "description" },
];

const parseFraction = (value?: string) => {
    const match = /([\d.]+)\s*\/\s*([\d.]+)/.exec(value ?? "");
    if (!match) return { done: 0, total: 0 };
    return { done: parseFloat(match[1]), total: parseFloat(match[2]) };
};

const fmtDateParam = (d: Date) => d.toISOString().split("T")[0];

const ALL_GODOWNS: GodownOption = { godown_id: "", godown_name: "All Godowns" };

const DeliveryFunnel = () => {
    const navigation =
        useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { colors, typography } = useTheme();
    const styles = getStyles(typography, colors);

    const companyId = storage.getString("companyId") ?? "";

    const [fromDate, setFromDate] = React.useState<Date>(() => new Date());
    const [toDate, setToDate] = React.useState<Date>(() => new Date());
    const [selectedGodown, setSelectedGodown] =
        React.useState<GodownOption>(ALL_GODOWNS);
    const [filterModalVisible, setFilterModalVisible] = React.useState(false);
    const [viewMode, setViewMode] = React.useState<ViewMode>("abstract");
    const [expandedDate, setExpandedDate] = React.useState<string | null>(null);

    const fromStr = fmtDateParam(fromDate);
    const toStr = fmtDateParam(toDate);

    const { data: godownList = [] } = useQuery({
        queryKey: ["deliveryFunnelGodowns", companyId],
        queryFn: () => fetchGodown(companyId),
        enabled: !!companyId,
        staleTime: 1000 * 60 * 5,
        retry: 1,
    });

    const godownOptions: GodownOption[] = [
        ALL_GODOWNS,
        ...(godownList as any[])
            .filter(g => g.Godown_Name)
            .map(g => ({
                godown_id: String(g.Godown_Id),
                godown_name: g.Godown_Name,
            })),
    ];

    const {
        data: cumulative = [],
        isLoading: cumulativeLoading,
        isError: cumulativeError,
        refetch: refetchCumulative,
    } = useQuery({
        queryKey: [
            "deliveryFunnel",
            fromStr,
            toStr,
            companyId,
            selectedGodown.godown_id,
        ],
        queryFn: () =>
            fetchDeliveryFunnel(
                fromStr,
                toStr,
                companyId,
                selectedGodown.godown_id || undefined,
            ),
        enabled:
            viewMode === "abstract" && !!companyId && !!fromStr && !!toStr,
        staleTime: 1000 * 60 * 2,
        retry: 1,
    });

    const {
        data: dayWise = [],
        isLoading: dayWiseLoading,
        isError: dayWiseError,
        refetch: refetchDayWise,
    } = useQuery({
        queryKey: [
            "deliveryFunnelDayWise",
            fromStr,
            toStr,
            companyId,
            selectedGodown.godown_id,
        ],
        queryFn: () =>
            fetchDeliveryFunnelDayWise(
                fromStr,
                toStr,
                companyId,
                selectedGodown.godown_id || undefined,
            ),
        enabled:
            viewMode === "expanded" && !!companyId && !!fromStr && !!toStr,
        staleTime: 1000 * 60 * 2,
        retry: 1,
    });

    const groupedDays = React.useMemo(() => {
        const map = new Map<
            string,
            { date: string; count?: FunnelDayRow; tonnage?: FunnelDayRow }
        >();
        (dayWise as FunnelDayRow[]).forEach(row => {
            const key = row.ReportDate;
            if (!map.has(key)) map.set(key, { date: key });
            const entry = map.get(key)!;
            if (row.Metric === "Count") entry.count = row;
            else if (row.Metric === "Tonnage") entry.tonnage = row;
        });
        return Array.from(map.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
    }, [dayWise]);

    const abstractCount = (cumulative as FunnelRow[]).find(
        r => r.Metric === "Count",
    );
    const abstractTonnage = (cumulative as FunnelRow[]).find(
        r => r.Metric === "Tonnage",
    );

    const formatDisplayDate = (iso: string) => {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const renderStageCard = (
        stage: (typeof FUNNEL_STAGES)[number],
        countRow?: FunnelRow,
        tonnageRow?: FunnelRow,
    ) => {
        const countVal = countRow?.[stage.key] ?? "0/0";
        const tonVal = tonnageRow?.[stage.key] ?? "0.00/0.00 Ton";
        const { done, total } = parseFraction(countVal);
        const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
        const statusColor =
            total === 0
                ? colors.textSecondary
                : done >= total
                  ? colors.success
                  : done > 0
                    ? colors.accent
                    : colors.textSecondary;

        return (
            <View key={stage.key} style={styles.stageCard}>
                <View style={styles.stageTopRow}>
                    <View style={styles.stageLabelRow}>
                        <View
                            style={[
                                styles.stageIconWrap,
                                { backgroundColor: statusColor + "15" },
                            ]}>
                            <Icon name={stage.icon} size={15} color={statusColor} />
                        </View>
                        <Text style={styles.stageLabel}>{stage.label}</Text>
                    </View>
                    <Text style={[styles.stageCountText, { color: statusColor }]}>
                        {countVal}
                    </Text>
                </View>
                <View style={styles.progressTrack}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${pct}%`, backgroundColor: statusColor },
                        ]}
                    />
                </View>
                <Text style={styles.stageTonText}>{tonVal}</Text>
            </View>
        );
    };

    const renderStageList = (countRow?: FunnelRow, tonnageRow?: FunnelRow) => (
        <View style={styles.stageList}>
            {FUNNEL_STAGES.map(stage => renderStageCard(stage, countRow, tonnageRow))}
        </View>
    );

    const isAbstract = viewMode === "abstract";
    const activeLoading = isAbstract ? cumulativeLoading : dayWiseLoading;
    const activeError = isAbstract ? cumulativeError : dayWiseError;
    const activeRefetch = isAbstract ? refetchCumulative : refetchDayWise;
    const isEmpty = isAbstract
        ? (cumulative as FunnelRow[]).length === 0
        : groupedDays.length === 0;

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <AppHeader
                title="Delivery Funnel"
                navigation={navigation}
                showRightIcon
                rightIconLibrary="MaterialIcon"
                rightIconName="tune"
                onRightPress={() => setFilterModalVisible(true)}
            />

            <FilterModal
                visible={filterModalVisible}
                title="Filter Delivery Funnel"
                fromDate={fromDate}
                onFromDateChange={setFromDate}
                showToDate
                toDate={toDate}
                onToDateChange={setToDate}
                onApply={() => setFilterModalVisible(false)}
                onClose={() => setFilterModalVisible(false)}
            />

            <View style={styles.filterRow}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.filterLabel}>Godown</Text>
                    <EnhancedDropdown
                        data={godownOptions}
                        labelField="godown_name"
                        valueField="godown_id"
                        placeholder="All Godowns"
                        value={selectedGodown.godown_id}
                        onChange={(item: GodownOption) => setSelectedGodown(item)}
                    />
                </View>
                <TouchableOpacity
                    style={styles.dateRangeChip}
                    onPress={() => setFilterModalVisible(true)}>
                    <Icon name="event" size={14} color={colors.primary} />
                    <Text style={styles.dateRangeText}>
                        {fromStr === toStr
                            ? formatDisplayDate(fromStr)
                            : `${formatDisplayDate(fromStr)} - ${formatDisplayDate(toStr)}`}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.viewToggleRow}>
                <TouchableOpacity
                    style={[
                        styles.viewToggleBtn,
                        isAbstract && styles.viewToggleBtnActive,
                    ]}
                    onPress={() => setViewMode("abstract")}>
                    <Text
                        style={[
                            styles.viewToggleText,
                            isAbstract && styles.viewToggleTextActive,
                        ]}>
                        Abstract
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.viewToggleBtn,
                        !isAbstract && styles.viewToggleBtnActive,
                    ]}
                    onPress={() => setViewMode("expanded")}>
                    <Text
                        style={[
                            styles.viewToggleText,
                            !isAbstract && styles.viewToggleTextActive,
                        ]}>
                        Expanded
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.list}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}>
                <Text style={styles.sectionTitle} numberOfLines={2}>
                    {isAbstract
                        ? `SALES DELIVERY FUNNEL TRACKING - ${selectedGodown.godown_name.toUpperCase()}`
                        : "SALES DELIVERY FUNNEL TRACKING - DAYWISE"}
                </Text>

                {activeLoading && (
                    <View style={styles.centeredState}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.stateText}>Loading funnel...</Text>
                    </View>
                )}

                {!activeLoading && activeError && (
                    <View style={styles.centeredState}>
                        <Icon name="error-outline" size={40} color={colors.accent} />
                        <Text style={styles.stateText}>Failed to load funnel data</Text>
                        <TouchableOpacity
                            style={styles.retryBtn}
                            onPress={() => activeRefetch()}>
                            <Icon name="refresh" size={18} color={colors.white} />
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {!activeLoading && !activeError && isEmpty && (
                    <View style={styles.centeredState}>
                        <Icon name="event-busy" size={32} color={colors.textSecondary} />
                        <Text style={styles.stateText}>
                            No data for the selected range
                        </Text>
                    </View>
                )}

                {!activeLoading &&
                    !activeError &&
                    !isEmpty &&
                    isAbstract &&
                    renderStageList(abstractCount, abstractTonnage)}

                {!activeLoading &&
                    !activeError &&
                    !isEmpty &&
                    !isAbstract &&
                    groupedDays.map(day => {
                        const single = groupedDays.length === 1;
                        const isOpen = single || expandedDate === day.date;
                        return (
                            <View key={day.date} style={styles.dayCard}>
                                {single ? (
                                    <Text style={styles.dayCardDateStandalone}>
                                        {formatDisplayDate(day.date)}
                                    </Text>
                                ) : (
                                    <TouchableOpacity
                                        style={styles.dayCardHeader}
                                        activeOpacity={0.8}
                                        onPress={() =>
                                            setExpandedDate(isOpen ? null : day.date)
                                        }>
                                        <Text style={styles.dayCardDate}>
                                            {formatDisplayDate(day.date)}
                                        </Text>
                                        <Icon
                                            name={isOpen ? "expand-less" : "expand-more"}
                                            size={20}
                                            color={colors.textSecondary}
                                        />
                                    </TouchableOpacity>
                                )}
                                {isOpen && renderStageList(day.count, day.tonnage)}
                            </View>
                        );
                    })}
            </ScrollView>
        </SafeAreaView>
    );
};

export default DeliveryFunnel;

const getStyles = (typography: any, colors: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.primary,
        },
        filterRow: {
            flexDirection: "row",
            alignItems: "flex-end",
            backgroundColor: colors.white,
            paddingHorizontal: responsiveWidth(3),
            paddingTop: responsiveHeight(1),
            paddingBottom: responsiveHeight(1),
            gap: responsiveWidth(2),
            borderBottomWidth: 1,
            borderBottomColor: colors.border ?? "#E5E7EB",
        },
        dateRangeChip: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: colors.primary + "12",
            borderRadius: 20,
            paddingHorizontal: responsiveWidth(3),
            paddingVertical: responsiveHeight(1),
        },
        dateRangeText: {
            ...typography.caption,
            color: colors.primary,
            fontWeight: "700",
        },
        filterLabel: {
            ...typography.subtitle2,
            color: colors.grey900 ?? colors.text,
            fontWeight: "600",
            marginBottom: responsiveHeight(0.8),
            opacity: 0.9,
        },
        viewToggleRow: {
            flexDirection: "row",
            backgroundColor: colors.white,
            paddingHorizontal: responsiveWidth(4),
            paddingBottom: responsiveHeight(1.2),
            gap: responsiveWidth(2),
            borderBottomWidth: 1,
            borderBottomColor: colors.border ?? "#E5E7EB",
        },
        viewToggleBtn: {
            paddingHorizontal: responsiveWidth(4),
            paddingVertical: responsiveHeight(0.8),
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.primary,
        },
        viewToggleBtnActive: {
            backgroundColor: colors.primary,
        },
        viewToggleText: {
            ...typography.caption,
            color: colors.primary,
            fontWeight: "700",
        },
        viewToggleTextActive: {
            color: colors.white,
        },
        list: {
            flex: 1,
            backgroundColor: colors.white,
        },
        scrollContent: {
            paddingHorizontal: responsiveWidth(4),
            paddingBottom: responsiveHeight(4),
            backgroundColor: colors.white,
        },
        sectionTitle: {
            ...typography.body1,
            color: colors.text,
            fontWeight: "800",
            marginTop: responsiveHeight(2),
            marginBottom: responsiveHeight(1),
            letterSpacing: 0.3,
        },
        centeredState: {
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: responsiveHeight(4),
            gap: responsiveHeight(1),
        },
        stateText: {
            ...typography.body2,
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
        stageList: {
            gap: responsiveHeight(1),
        },
        stageCard: {
            backgroundColor: colors.white,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border ?? "#E5E7EB",
            padding: responsiveWidth(3.5),
        },
        stageTopRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        stageLabelRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: responsiveWidth(2.5),
            flex: 1,
        },
        stageIconWrap: {
            width: responsiveWidth(8),
            height: responsiveWidth(8),
            borderRadius: responsiveWidth(4),
            alignItems: "center",
            justifyContent: "center",
        },
        stageLabel: {
            ...typography.body2,
            color: colors.text,
            fontWeight: "700",
        },
        stageCountText: {
            ...typography.body1,
            fontWeight: "800",
        },
        progressTrack: {
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.surface ?? "#F1F3F5",
            marginTop: responsiveHeight(1.2),
            overflow: "hidden",
        },
        progressFill: {
            height: "100%",
            borderRadius: 3,
        },
        stageTonText: {
            ...typography.caption,
            color: colors.textSecondary,
            marginTop: responsiveHeight(0.7),
        },
        dayCard: {
            backgroundColor: colors.surface ?? colors.background,
            borderRadius: 12,
            marginBottom: responsiveHeight(1.5),
        },
        dayCardHeader: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: colors.white,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border ?? "#E5E7EB",
            paddingHorizontal: responsiveWidth(3.5),
            paddingVertical: responsiveHeight(1.4),
            marginBottom: responsiveHeight(1),
        },
        dayCardDate: {
            ...typography.body2,
            color: colors.text,
            fontWeight: "700",
        },
        dayCardDateStandalone: {
            ...typography.caption,
            color: colors.textSecondary,
            fontWeight: "700",
            textTransform: "uppercase",
            marginBottom: responsiveHeight(1),
        },
    });
