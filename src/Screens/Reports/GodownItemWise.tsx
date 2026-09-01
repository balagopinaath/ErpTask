import {
    StyleSheet,
    Text,
    View,
    FlatList,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Modal,
} from "react-native";
import React from "react";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import AppHeader from "../../Components/AppHeader";
import { RootStackParamList } from "../../Navigation/types";
import { responsiveHeight, responsiveWidth } from "../../constants/helper";
import { fetchGodownItemWise, fetchGodownTransactions } from "../../Api/reports";

interface GodownItem {
    Product_Id: string;
    Stock_Item: string;
    stock_item_name: string;
    Godown_Name: string;
    Godown_Id: string;
    Brand: string;
    Stock_Group: string;
    S_Sub_Group_1: string | null;
    OB_Act_Qty: number;
    OB_Bal_Qty: number;
    IN_Act_Qty: number;
    IN_Qty: number;
    OUT_Act_Qty: number;
    OUT_Qty: number;
    Act_Bal_Qty: number;
    Bal_Qty: number;
    Product_Rate: number;
}

interface GodownTransaction {
    transaction_date: string;
    module: string;
    module_voucher_number: string;
    godown_id: string;
    item_id: number;
    godown_name: string;
    item_name: string;
    quantity: number;
    stock_direction: "IN" | "OUT" | "PROCESS IN" | "PROCESS OUT" | string;
    trip_id: string | null;
    Trip_No: string | null;
    Loadman_Name: string | null;
    Taken_By_Name?: string | null;
    Taken_Status?: "TAKEN" | "PENDING" | null;
    Inplace?: string | null;
    trip_date: string | null;
    trip_voucher_number: string | null;
}

type TxCategory =
    | "TRIP_IN"
    | "RETURN"
    | "PROCESS_IN"
    | "PROCESS_OUT"
    | "TAKEN"
    | "PENDING_TAKEN"
    | "INPLACE"
    | null;

const categorizeTx = (tx: GodownTransaction): TxCategory => {
    switch (tx.stock_direction) {
        case "IN":
            return tx.trip_id ? "TRIP_IN" : "RETURN";
        case "PROCESS IN":
            return "PROCESS_IN";
        case "PROCESS OUT":
            return "PROCESS_OUT";
        case "OUT":
            if (tx.Inplace) return "INPLACE";
            return tx.Taken_Status === "TAKEN" ? "TAKEN" : "PENDING_TAKEN";
        default:
            return null;
    }
};

type FilterOption = { key: string; label: string };

const IN_FILTER_OPTIONS: FilterOption[] = [
    { key: "TRIP_IN", label: "Trip In" },
    { key: "RETURN", label: "Return" },
];
const PROCESS_FILTER_OPTIONS: FilterOption[] = [
    { key: "PROCESS_IN", label: "Process In" },
    { key: "PROCESS_OUT", label: "Process Out" },
];
const OUT_FILTER_OPTIONS: FilterOption[] = [
    { key: "TAKEN", label: "Taken" },
    { key: "PENDING_TAKEN", label: "Pending Taken" },
    { key: "INPLACE", label: "Inplace" },
];

type FilterGroupKey = "in" | "process" | "out" | "module" | "viewMode";

type ModuleFilter = "ALL" | "SALES" | "GODOWN_TRANSFER";

const MODULE_FILTER_OPTIONS: { key: ModuleFilter; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "SALES", label: "Sales" },
    { key: "GODOWN_TRANSFER", label: "Godown Transfer" },
];

const matchesModuleFilter = (tx: GodownTransaction, filter: ModuleFilter) => {
    if (filter === "ALL") return true;
    const module = tx.module?.toUpperCase();
    if (filter === "SALES") return module === "SALES";
    return module === "STOCK JOURNAL GODOWN TRANSFER";
};

type OutViewMode = "TAKEN" | "TRIPWISE";

const VIEW_MODE_OPTIONS: { key: OutViewMode; label: string }[] = [
    { key: "TAKEN", label: "Taken" },
    { key: "TRIPWISE", label: "Tripwise" },
];

type RouteParams = RouteProp<RootStackParamList, "GodownItemWise">;

const GodownItemWise = () => {
    const navigation =
        useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<RouteParams>();
    const { godownId, godownName, fromDate, toDate, companyId } = route.params;

    const { colors, typography } = require("../../Context/ThemeContext").useTheme();
    const styles = getStyles(typography, colors);
    const insets = useSafeAreaInsets();

    const [searchText, setSearchText] = React.useState("");
    const [selectedBrand, setSelectedBrand] = React.useState<string | null>(null);
    const [openFilter, setOpenFilter] = React.useState<FilterGroupKey | null>(null);
    const [movementModalItem, setMovementModalItem] = React.useState<GodownItem | null>(null);
    const [movementTab, setMovementTab] = React.useState<"IN" | "OUT">("IN");

    const [outModuleFilter, setOutModuleFilter] = React.useState<ModuleFilter>("ALL");
    const [outViewMode, setOutViewMode] = React.useState<OutViewMode>("TAKEN");
    const [expandedTrip, setExpandedTrip] = React.useState<string | null>(null);

    const [inFilter, setInFilter] = React.useState<Set<string>>(
        new Set(IN_FILTER_OPTIONS.map(o => o.key)),
    );
    const [processFilter, setProcessFilter] = React.useState<Set<string>>(
        new Set(PROCESS_FILTER_OPTIONS.map(o => o.key)),
    );
    const [outFilter, setOutFilter] = React.useState<Set<string>>(
        new Set(OUT_FILTER_OPTIONS.map(o => o.key)),
    );

    const { data: items = [], isLoading, isError, refetch } = useQuery({
        queryKey: ["godownItemWise", godownId, fromDate, toDate, companyId],
        queryFn: () => fetchGodownItemWise(godownId, fromDate, toDate, companyId),
        enabled: !!godownId && !!fromDate && !!toDate && !!companyId,
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 10,
        retry: 1,
    });

    const {
        data: transactions = [],
        isLoading: txLoading,
        isError: txError,
        refetch: refetchTx,
    } = useQuery({
        queryKey: ["godownTransactions", godownId, fromDate, toDate, companyId],
        queryFn: () => fetchGodownTransactions(godownId, fromDate, toDate, companyId),
        enabled: !!godownId && !!fromDate && !!toDate && !!companyId,
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 10,
        retry: 1,
    });

    const brands = React.useMemo(() => {
        const unique = Array.from(
            new Set((items as GodownItem[]).map(i => i.Stock_Group).filter(Boolean)),
        ).sort() as string[];
        return unique;
    }, [items]);

    const filtered = React.useMemo(() => {
        const q = searchText.toLowerCase();
        return (items as GodownItem[]).filter(
            item =>
                (!selectedBrand || item.Stock_Group === selectedBrand) &&
                (item.Stock_Item.toLowerCase().includes(q) ||
                    item.Brand?.toLowerCase().includes(q) ||
                    item.Stock_Group?.toLowerCase().includes(q)),
        );
    }, [items, searchText, selectedBrand]);

    const filterGroups = {
        in: {
            label: "In",
            options: IN_FILTER_OPTIONS,
            selected: inFilter,
            setSelected: setInFilter,
        },
        process: {
            label: "Process",
            options: PROCESS_FILTER_OPTIONS,
            selected: processFilter,
            setSelected: setProcessFilter,
        },
        out: {
            label: "Out",
            options: OUT_FILTER_OPTIONS,
            selected: outFilter,
            setSelected: setOutFilter,
        },
    } as const;

    const toggleFilterValue = (
        setFn: React.Dispatch<React.SetStateAction<Set<string>>>,
        key: string,
    ) => {
        setFn(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const passesFilters = React.useCallback(
        (tx: GodownTransaction) => {
            const cat = categorizeTx(tx);
            if (cat === null) return true;
            if (cat === "TRIP_IN" || cat === "RETURN") return inFilter.has(cat);
            if (cat === "PROCESS_IN" || cat === "PROCESS_OUT")
                return processFilter.has(cat);
            if (!outFilter.has(cat)) return false;
            return matchesModuleFilter(tx, outModuleFilter);
        },
        [inFilter, processFilter, outFilter, outModuleFilter],
    );

    const filteredTransactions = React.useMemo(
        () => (transactions as GodownTransaction[]).filter(passesFilters),
        [transactions, passesFilters],
    );

    const filteredProductIds = React.useMemo(
        () => new Set(filtered.map(item => item.Product_Id)),
        [filtered],
    );

    const globalTxTotals = React.useMemo(() => {
        return filteredTransactions
            .filter(t => filteredProductIds.has(String(t.item_id)))
            .reduce(
                (acc, t) => {
                    if (t.stock_direction === "IN") acc.in += t.quantity;
                    else if (t.stock_direction === "OUT") acc.out += t.quantity;
                    else if (t.stock_direction === "PROCESS IN") acc.processIn += t.quantity;
                    else if (t.stock_direction === "PROCESS OUT") acc.processOut += t.quantity;
                    return acc;
                },
                { in: 0, out: 0, processIn: 0, processOut: 0 },
            );
    }, [filteredTransactions, filteredProductIds]);

    const totals = React.useMemo(() => {
        const base = filtered.reduce(
            (acc, item) => ({
                items: acc.items + 1,
                obBal: acc.obBal + item.OB_Bal_Qty,
            }),
            { items: 0, obBal: 0 },
        );
        const processNet = globalTxTotals.processIn - globalTxTotals.processOut;
        return {
            ...base,
            inQty: globalTxTotals.in,
            outQty: globalTxTotals.out,
            processNet,
            actBal: base.obBal + globalTxTotals.in - globalTxTotals.out + processNet,
        };
    }, [filtered, globalTxTotals]);

    // OUT-direction transactions for the whole godown, already respecting the
    // brand/search filter and the In/Process/Out + Module filters.
    const outDirectionTx = React.useMemo(
        () =>
            filteredTransactions.filter(
                t =>
                    t.stock_direction === "OUT" &&
                    filteredProductIds.has(String(t.item_id)),
            ),
        [filteredTransactions, filteredProductIds],
    );

    const outBreakdownTotals = React.useMemo(() => {
        return outDirectionTx.reduce(
            (acc, tx) => {
                if (tx.Inplace) acc.inplace += tx.quantity;
                else if (tx.Taken_Status === "TAKEN") acc.taken += tx.quantity;
                else acc.pending += tx.quantity;
                return acc;
            },
            { taken: 0, pending: 0, inplace: 0 },
        );
    }, [outDirectionTx]);

    const outByTrip = React.useMemo(() => {
        const map = new Map<
            string,
            {
                key: string;
                tripNo: string | null;
                loadman: string | null;
                items: GodownTransaction[];
                total: number;
            }
        >();
        outDirectionTx.forEach(tx => {
            const key = tx.Trip_No ?? "no-trip";
            if (!map.has(key)) {
                map.set(key, {
                    key,
                    tripNo: tx.Trip_No,
                    loadman: tx.Loadman_Name,
                    items: [],
                    total: 0,
                });
            }
            const entry = map.get(key)!;
            entry.items.push(tx);
            entry.total += tx.quantity;
        });
        return Array.from(map.values()).sort((a, b) => {
            if (a.tripNo === null) return 1;
            if (b.tripNo === null) return -1;
            return Number(b.tripNo) - Number(a.tripNo);
        });
    }, [outDirectionTx]);

    const fmt = (n: number) => {
        if (Math.abs(n) >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
        if (Math.abs(n) >= 100000) return `${(n / 100000).toFixed(1)}L`;
        if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return n.toFixed(0);
    };

    const formatDate = (iso: string) => {
        if (!iso) return "";
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const moduleColor = (module: string) => {
        switch (module?.toUpperCase()) {
            case "PURCHASE":
            case "STOCK JOURNAL MATERIAL INWARD":
            case "STOCK JOURNAL PRODUCTION":
                return colors.success;
            case "SALES":
            case "STOCK JOURNAL CONSUMPTION":
                return colors.accent;
            case "CREDIT NOTE":
                return colors.info;
            default:
                return colors.primary;
        }
    };

    const directionMeta = (direction: string) => {
        if (direction === "IN" || direction === "PROCESS IN")
            return { color: colors.success, icon: "arrow-downward" as const };
        return { color: colors.accent, icon: "arrow-upward" as const };
    };

    // Transactions (post-filter) keyed by Product_Id
    const transactionsByItem = React.useMemo(() => {
        const map = new Map<string, GodownTransaction[]>();
        filteredTransactions.forEach(tx => {
            const key = String(tx.item_id);
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(tx);
        });
        map.forEach(list =>
            list.sort(
                (a, b) =>
                    new Date(b.transaction_date).getTime() -
                    new Date(a.transaction_date).getTime(),
            ),
        );
        return map;
    }, [filteredTransactions]);

    const renderMovementRow = (tx: GodownTransaction, idx: number, total: number) => {
        const meta = directionMeta(tx.stock_direction);
        return (
            <View
                key={`${tx.module_voucher_number}-${idx}`}
                style={[styles.txRow, idx === total - 1 && { borderBottomWidth: 0 }]}>
                <View style={{ flex: 1 }}>
                    <View style={styles.badgeRow}>
                        <View
                            style={[
                                styles.badge,
                                { backgroundColor: moduleColor(tx.module) + "15" },
                            ]}>
                            <Text style={[styles.badgeText, { color: moduleColor(tx.module) }]}>
                                {tx.module}
                            </Text>
                        </View>
                        {!!tx.Trip_No && (
                            <View style={[styles.badge, { backgroundColor: colors.primary + "15" }]}>
                                <Text style={[styles.badgeText, { color: colors.primary }]}>
                                    Trip #{tx.Trip_No}
                                </Text>
                            </View>
                        )}
                        {tx.stock_direction === "OUT" && (
                            <View
                                style={[
                                    styles.badge,
                                    { backgroundColor: colors.textSecondary + "15" },
                                ]}>
                                <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                                    {tx.Inplace
                                        ? "Inplace"
                                        : tx.Taken_Status === "TAKEN"
                                          ? "Taken"
                                          : "Pending Taken"}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.statAct}>
                        {tx.module_voucher_number} · {formatDate(tx.transaction_date)}
                    </Text>
                </View>
                <View style={[styles.directionBadge, { backgroundColor: meta.color + "15" }]}>
                    <Icon name={meta.icon} size={12} color={meta.color} />
                    <Text style={[styles.directionText, { color: meta.color }]}>
                        {tx.quantity}
                    </Text>
                </View>
            </View>
        );
    };

    // Taken-mode list: only items with at least one outward movement.
    const takenViewItems = React.useMemo(
        () =>
            filtered.filter(item =>
                (transactionsByItem.get(item.Product_Id) ?? []).some(
                    t => t.stock_direction === "OUT",
                ),
            ),
        [filtered, transactionsByItem],
    );

    const renderItem = ({ item }: { item: GodownItem }) => {
        const itemTx = transactionsByItem.get(item.Product_Id) ?? [];

        const itemOutTx = itemTx.filter(t => t.stock_direction === "OUT");
        const itemTaken = itemOutTx
            .filter(t => !t.Inplace && t.Taken_Status === "TAKEN")
            .reduce((s, t) => s + t.quantity, 0);
        const itemPending = itemOutTx
            .filter(t => !t.Inplace && t.Taken_Status !== "TAKEN")
            .reduce((s, t) => s + t.quantity, 0);
        const itemInplace = itemOutTx
            .filter(t => !!t.Inplace)
            .reduce((s, t) => s + t.quantity, 0);
        const itemTotalOutward = itemTaken + itemPending + itemInplace;
        const itemClosing = item.Bal_Qty;

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                style={styles.card}
                onPress={() => {
                    setMovementTab("IN");
                    setMovementModalItem(item);
                }}>
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.itemName} numberOfLines={2}>
                            {item.Stock_Item}
                        </Text>
                        <View style={styles.badgeRow}>
                            {!!item.Brand && (
                                <View style={[styles.badge, { backgroundColor: colors.primary + "15" }]}>
                                    <Text style={[styles.badgeText, { color: colors.primary }]}>
                                        {item.Brand}
                                    </Text>
                                </View>
                            )}
                            {!!item.Stock_Group && item.Stock_Group !== item.Brand && (
                                <View style={[styles.badge, { backgroundColor: colors.info + "15" }]}>
                                    <Text style={[styles.badgeText, { color: colors.info }]}>
                                        {item.Stock_Group}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <View style={styles.balanceChip}>
                        <Text style={styles.balanceChipVal}>{fmt(itemClosing)}</Text>
                        <Text style={styles.balanceChipLabel}>Closing</Text>
                    </View>
                    <Icon name="chevron-right" size={22} color={colors.textSecondary} />
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statCell}>
                        <Text style={styles.statLabel}>Taken</Text>
                        <Text style={[styles.statValue, { color: colors.success }]}>
                            {itemTaken === 0 ? "-" : fmt(itemTaken)}
                        </Text>
                    </View>
                    <View style={[styles.statCell, styles.borderLeft]}>
                        <Text style={styles.statLabel}>Pending Taken</Text>
                        <Text style={[styles.statValue, { color: colors.accent }]}>
                            {itemPending === 0 ? "-" : fmt(itemPending)}
                        </Text>
                    </View>
                    <View style={[styles.statCell, styles.borderLeft]}>
                        <Text style={styles.statLabel}>Inplace</Text>
                        <Text style={[styles.statValue, { color: colors.info }]}>
                            {itemInplace === 0 ? "-" : fmt(itemInplace)}
                        </Text>
                    </View>
                    <View style={[styles.statCell, styles.borderLeft]}>
                        <Text style={styles.statLabel}>Total Outward</Text>
                        <Text style={[styles.statValue, { color: colors.textDanger }]}>
                            {itemTotalOutward === 0 ? "-" : fmt(itemTotalOutward)}
                        </Text>
                    </View>
                </View>

                <View style={styles.viewMovementsRow}>
                    <Icon name="swap-vert" size={16} color={colors.primary} />
                    <Text style={styles.viewMovementsText}>
                        {itemTx.length > 0
                            ? `View ${itemTx.length} movement${itemTx.length === 1 ? "" : "s"}`
                            : "No movements in range"}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const modalTx = movementModalItem
        ? transactionsByItem.get(movementModalItem.Product_Id) ?? []
        : [];
    const modalInTx = modalTx.filter(
        t => t.stock_direction === "IN" || t.stock_direction === "PROCESS IN",
    );
    const modalOutTx = modalTx.filter(
        t => t.stock_direction === "OUT" || t.stock_direction === "PROCESS OUT",
    );
    const activeModalList = movementTab === "IN" ? modalInTx : modalOutTx;

    const listHeader = (
        <>
            {/* Summary row */}
            {outViewMode === "TAKEN" ? (
                <View style={styles.summaryRow}>
                    <View style={styles.summaryCard}>
                        <Text style={[styles.summaryVal, { color: colors.success }]}>
                            {fmt(outBreakdownTotals.taken)}
                        </Text>
                        <Text style={styles.summaryLbl}>Taken</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={[styles.summaryVal, { color: colors.accent }]}>
                            {fmt(outBreakdownTotals.pending)}
                        </Text>
                        <Text style={styles.summaryLbl}>Pending Taken</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={[styles.summaryVal, { color: colors.info }]}>
                            {fmt(outBreakdownTotals.inplace)}
                        </Text>
                        <Text style={styles.summaryLbl}>Inplace</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={[styles.summaryVal, { color: colors.textDanger }]}>
                            {fmt(totals.outQty)}
                        </Text>
                        <Text style={styles.summaryLbl}>Total Outward</Text>
                    </View>
                </View>
            ) : (
                <View style={styles.summaryRow}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryVal}>{totals.items}</Text>
                        <Text style={styles.summaryLbl}>Items</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryVal}>{fmt(totals.obBal)}</Text>
                        <Text style={styles.summaryLbl}>Opening</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={[styles.summaryVal, { color: colors.success }]}>
                            {fmt(totals.inQty)}
                        </Text>
                        <Text style={styles.summaryLbl}>IN</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={[styles.summaryVal, { color: colors.accent }]}>
                            {fmt(totals.outQty)}
                        </Text>
                        <Text style={styles.summaryLbl}>OUT</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={[styles.summaryVal, { color: colors.primary }]}>
                            {fmt(totals.actBal)}
                        </Text>
                        <Text style={styles.summaryLbl}>Closing</Text>
                    </View>
                </View>
            )}

            {/* Search */}
            <View style={styles.searchBar}>
                <Icon name="search" size={20} color={colors.textSecondary} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search items, brand..."
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

            {/* Brand filter chips */}
            {brands.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.chipScroll}
                    contentContainerStyle={styles.chipScrollContent}>
                    <TouchableOpacity
                        style={[styles.chip, !selectedBrand && styles.chipActive]}
                        onPress={() => setSelectedBrand(null)}>
                        <Text
                            style={[
                                styles.chipText,
                                !selectedBrand && styles.chipTextActive,
                            ]}>
                            All
                        </Text>
                    </TouchableOpacity>
                    {brands.map(brand => (
                        <TouchableOpacity
                            key={brand}
                            style={[
                                styles.chip,
                                selectedBrand === brand && styles.chipActive,
                            ]}
                            onPress={() =>
                                setSelectedBrand(
                                    selectedBrand === brand ? null : brand,
                                )
                            }>
                            <Text
                                style={[
                                    styles.chipText,
                                    selectedBrand === brand && styles.chipTextActive,
                                ]}>
                                {brand}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {outViewMode === "TRIPWISE" && (
                <View style={styles.tripwiseBanner}>
                    <Icon name="local-shipping" size={14} color={colors.primary} />
                    <Text style={styles.tripwiseBannerText}>
                        Showing outward movements grouped by trip
                    </Text>
                </View>
            )}
        </>
    );

    const renderOutTripCard = (trip: (typeof outByTrip)[number]) => {
        const isOpen = expandedTrip === trip.key;
        return (
            <View key={trip.key} style={styles.outCard}>
                <TouchableOpacity
                    style={styles.outTripHeader}
                    activeOpacity={0.8}
                    onPress={() => setExpandedTrip(isOpen ? null : trip.key)}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.outCardTitle}>
                            {trip.tripNo ? `Trip #${trip.tripNo}` : "No Trip"}
                        </Text>
                        {!!trip.loadman && (
                            <Text style={styles.statAct}>{trip.loadman}</Text>
                        )}
                    </View>
                    <Text style={styles.outCardTotal}>{fmt(trip.total)}</Text>
                    <Icon
                        name={isOpen ? "expand-less" : "expand-more"}
                        size={20}
                        color={colors.textSecondary}
                    />
                </TouchableOpacity>
                {isOpen &&
                    trip.items.map((tx, idx) => (
                        <View
                            key={`${tx.item_id}-${idx}`}
                            style={[
                                styles.txRow,
                                idx === trip.items.length - 1 && { borderBottomWidth: 0 },
                            ]}>
                            <Text style={styles.txItemName} numberOfLines={2}>
                                {tx.item_name}
                            </Text>
                            <View
                                style={[
                                    styles.directionBadge,
                                    { backgroundColor: colors.accent + "15" },
                                ]}>
                                <Text style={[styles.directionText, { color: colors.accent }]}>
                                    {tx.quantity}
                                </Text>
                            </View>
                        </View>
                    ))}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
            <AppHeader title={godownName} navigation={navigation} />

            <View style={styles.filterRow}>
                {(Object.keys(filterGroups) as ("in" | "process" | "out")[]).map(
                    key => {
                        const group = filterGroups[key];
                        return (
                            <TouchableOpacity
                                key={key}
                                style={styles.filterBtn}
                                onPress={() => setOpenFilter(key)}>
                                <Text style={styles.filterBtnLabel}>{group.label}</Text>
                                <View style={styles.filterBtnValueRow}>
                                    <Text style={styles.filterBtnValue}>
                                        {group.selected.size}/{group.options.length}
                                    </Text>
                                    <Icon
                                        name="arrow-drop-down"
                                        size={18}
                                        color={colors.text}
                                    />
                                </View>
                            </TouchableOpacity>
                        );
                    },
                )}
            </View>

            <View style={styles.filterRow}>
                <TouchableOpacity
                    style={styles.filterBtn}
                    onPress={() => setOpenFilter("module")}>
                    <Text style={styles.filterBtnLabel}>Filter by Module</Text>
                    <View style={styles.filterBtnValueRow}>
                        <Text style={styles.filterBtnValue} numberOfLines={1}>
                            {MODULE_FILTER_OPTIONS.find(o => o.key === outModuleFilter)
                                ?.label ?? "All"}
                        </Text>
                        <Icon name="arrow-drop-down" size={18} color={colors.text} />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.filterBtn}
                    onPress={() => setOpenFilter("viewMode")}>
                    <Text style={styles.filterBtnLabel}>View Mode</Text>
                    <View style={styles.filterBtnValueRow}>
                        <Text style={styles.filterBtnValue}>
                            {VIEW_MODE_OPTIONS.find(o => o.key === outViewMode)?.label ??
                                "Taken"}
                        </Text>
                        <Icon name="arrow-drop-down" size={18} color={colors.text} />
                    </View>
                </TouchableOpacity>
            </View>

            <Modal
                visible={openFilter !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setOpenFilter(null)}>
                <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={() => setOpenFilter(null)}>
                    <View style={styles.filterPanel}>
                        {(openFilter === "in" ||
                            openFilter === "process" ||
                            openFilter === "out") &&
                            (() => {
                                const key = openFilter;
                                const group = filterGroups[key];
                                return group.options.map(opt => {
                                    const isChecked = group.selected.has(opt.key);
                                    return (
                                        <TouchableOpacity
                                            key={opt.key}
                                            style={styles.filterOptionRow}
                                            onPress={() =>
                                                toggleFilterValue(group.setSelected, opt.key)
                                            }>
                                            <View
                                                style={[
                                                    styles.checkbox,
                                                    isChecked && styles.checkboxChecked,
                                                ]}>
                                                {isChecked && (
                                                    <Icon
                                                        name="check"
                                                        size={14}
                                                        color={colors.white}
                                                    />
                                                )}
                                            </View>
                                            <Text style={styles.filterOptionLabel}>
                                                {opt.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                });
                            })()}

                        {openFilter === "module" &&
                            MODULE_FILTER_OPTIONS.map(opt => {
                                const isSelected = outModuleFilter === opt.key;
                                return (
                                    <TouchableOpacity
                                        key={opt.key}
                                        style={styles.filterOptionRow}
                                        onPress={() => {
                                            setOutModuleFilter(opt.key);
                                            setOpenFilter(null);
                                        }}>
                                        <View
                                            style={[
                                                styles.radio,
                                                isSelected && styles.radioSelected,
                                            ]}>
                                            {isSelected && <View style={styles.radioDot} />}
                                        </View>
                                        <Text style={styles.filterOptionLabel}>
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}

                        {openFilter === "viewMode" &&
                            VIEW_MODE_OPTIONS.map(opt => {
                                const isSelected = outViewMode === opt.key;
                                return (
                                    <TouchableOpacity
                                        key={opt.key}
                                        style={styles.filterOptionRow}
                                        onPress={() => {
                                            setOutViewMode(opt.key);
                                            setOpenFilter(null);
                                        }}>
                                        <View
                                            style={[
                                                styles.radio,
                                                isSelected && styles.radioSelected,
                                            ]}>
                                            {isSelected && <View style={styles.radioDot} />}
                                        </View>
                                        <Text style={styles.filterOptionLabel}>
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={!!movementModalItem}
                transparent
                animationType="slide"
                onRequestClose={() => setMovementModalItem(null)}>
                <TouchableOpacity
                    style={styles.movementModalBackdrop}
                    activeOpacity={1}
                    onPress={() => setMovementModalItem(null)}>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[
                            styles.movementModalCard,
                            {
                                height: responsiveHeight(70) + insets.bottom,
                                paddingBottom: insets.bottom,
                            },
                        ]}
                        onPress={() => {}}>
                        <View style={styles.movementModalHandle} />

                        <View style={styles.movementModalHeader}>
                            <Text style={styles.movementModalTitle} numberOfLines={2}>
                                {movementModalItem?.Stock_Item}
                            </Text>
                            <TouchableOpacity
                                style={styles.movementModalClose}
                                onPress={() => setMovementModalItem(null)}>
                                <Icon name="close" size={22} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.movementTabRow}>
                            <TouchableOpacity
                                style={[
                                    styles.movementTabBtn,
                                    movementTab === "IN" && styles.movementTabBtnActive,
                                ]}
                                onPress={() => setMovementTab("IN")}>
                                <Text
                                    style={[
                                        styles.movementTabText,
                                        movementTab === "IN" && styles.movementTabTextActive,
                                    ]}>
                                    IN ({modalInTx.length})
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.movementTabBtn,
                                    movementTab === "OUT" && styles.movementTabBtnActive,
                                ]}
                                onPress={() => setMovementTab("OUT")}>
                                <Text
                                    style={[
                                        styles.movementTabText,
                                        movementTab === "OUT" && styles.movementTabTextActive,
                                    ]}>
                                    OUT ({modalOutTx.length})
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {txLoading && (
                            <View style={styles.movementsState}>
                                <ActivityIndicator size="small" color={colors.primary} />
                            </View>
                        )}

                        {!txLoading && txError && (
                            <TouchableOpacity
                                style={styles.movementsState}
                                onPress={() => refetchTx()}>
                                <Icon name="error-outline" size={18} color={colors.accent} />
                                <Text style={styles.movementsEmptyText}>
                                    Failed to load. Tap to retry.
                                </Text>
                            </TouchableOpacity>
                        )}

                        {!txLoading && !txError && (
                            <FlatList
                                style={styles.movementModalBody}
                                data={activeModalList}
                                keyExtractor={(tx, idx) => `${tx.module_voucher_number}-${idx}`}
                                renderItem={({ item: tx, index }) =>
                                    renderMovementRow(tx, index, activeModalList.length)
                                }
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.movementModalListContent}
                                ListEmptyComponent={
                                    <View style={styles.movementsState}>
                                        <Text style={styles.movementsEmptyText}>
                                            No {movementTab} movements for this item in the
                                            selected range
                                        </Text>
                                    </View>
                                }
                            />
                        )}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {isLoading && (
                <View style={styles.centeredState}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.stateText}>Loading items...</Text>
                </View>
            )}

            {!isLoading && isError && (
                <View style={styles.centeredState}>
                    <Icon name="error-outline" size={48} color={colors.accent} />
                    <Text style={styles.stateText}>Failed to load item data</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
                        <Icon name="refresh" size={18} color={colors.white} />
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}

            {!isLoading && !isError && outViewMode === "TAKEN" && (
                <FlatList
                    style={styles.list}
                    data={takenViewItems}
                    keyExtractor={item => item.Product_Id}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={listHeader}
                    ListEmptyComponent={
                        <View style={styles.centeredState}>
                            <Icon name="inbox" size={48} color={colors.textSecondary} />
                            <Text style={styles.stateText}>
                                {items.length === 0
                                    ? "No data for selected dates"
                                    : "No outward movements for the current filters"}
                            </Text>
                        </View>
                    }
                />
            )}

            {!isLoading && !isError && outViewMode === "TRIPWISE" && (
                <FlatList
                    style={styles.list}
                    data={outByTrip}
                    keyExtractor={trip => trip.key}
                    renderItem={({ item: trip }) => renderOutTripCard(trip)}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={listHeader}
                    ListEmptyComponent={
                        <View style={styles.centeredState}>
                            <Icon
                                name="local-shipping"
                                size={48}
                                color={colors.textSecondary}
                            />
                            <Text style={styles.stateText}>
                                No outward trips for the current filters
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

export default GodownItemWise;

const getStyles = (typography: any, colors: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.primary,
        },
        centeredState: {
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: responsiveHeight(8),
            gap: responsiveHeight(1.5),
            backgroundColor: colors.white,
            flexGrow: 1,
        },
        stateText: {
            ...typography.body1,
            color: colors.textSecondary,
            textAlign: "center",
        },
        filterRow: {
            flexDirection: "row",
            backgroundColor: colors.white,
            paddingHorizontal: responsiveWidth(4),
            paddingVertical: responsiveHeight(1.2),
            borderBottomWidth: 1,
            borderBottomColor: colors.border ?? "#E5E7EB",
            gap: responsiveWidth(2.5),
        },
        filterBtn: {
            flex: 1,
            borderWidth: 1,
            borderColor: colors.border ?? "#E5E7EB",
            borderRadius: 8,
            paddingHorizontal: responsiveWidth(2.5),
            paddingVertical: responsiveHeight(0.6),
        },
        filterBtnLabel: {
            fontSize: 10,
            color: colors.textSecondary,
            fontWeight: "600",
        },
        filterBtnValueRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        filterBtnValue: {
            ...typography.body2,
            color: colors.text,
            fontWeight: "700",
        },
        modalBackdrop: {
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            justifyContent: "flex-start",
            alignItems: "center",
            paddingTop: responsiveHeight(16),
        },
        filterPanel: {
            backgroundColor: colors.white,
            borderRadius: 12,
            paddingVertical: responsiveHeight(1),
            minWidth: responsiveWidth(55),
            elevation: 6,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
        },
        filterOptionRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: responsiveWidth(3),
            paddingHorizontal: responsiveWidth(4),
            paddingVertical: responsiveHeight(1.2),
        },
        checkbox: {
            width: 20,
            height: 20,
            borderRadius: 4,
            borderWidth: 1.5,
            borderColor: colors.border ?? "#CBD5E1",
            alignItems: "center",
            justifyContent: "center",
        },
        checkboxChecked: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },
        radio: {
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 1.5,
            borderColor: colors.border ?? "#CBD5E1",
            alignItems: "center",
            justifyContent: "center",
        },
        radioSelected: {
            borderColor: colors.primary,
        },
        radioDot: {
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: colors.primary,
        },
        filterOptionLabel: {
            ...typography.body2,
            color: colors.text,
            fontWeight: "600",
        },
        viewMovementsRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            paddingVertical: responsiveHeight(1),
            borderTopWidth: 1,
            borderTopColor: colors.border ?? "#F3F4F6",
            backgroundColor: colors.surface ?? colors.background,
        },
        viewMovementsText: {
            ...typography.caption,
            color: colors.primary,
            fontWeight: "700",
        },
        movementModalBackdrop: {
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "flex-end",
        },
        movementModalCard: {
            backgroundColor: colors.white,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            height: responsiveHeight(70),
            overflow: "hidden",
        },
        movementModalHandle: {
            alignSelf: "center",
            width: responsiveWidth(10),
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.border ?? "#D1D5DB",
            marginTop: responsiveHeight(1),
        },
        movementModalHeader: {
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            paddingHorizontal: responsiveWidth(4),
            paddingTop: responsiveHeight(1.4),
            paddingBottom: responsiveHeight(1),
            borderBottomWidth: 1,
            borderBottomColor: colors.border ?? "#F3F4F6",
            gap: responsiveWidth(2),
        },
        movementModalTitle: {
            ...typography.body1,
            color: colors.text,
            fontWeight: "700",
            flex: 1,
        },
        movementModalClose: {
            padding: 4,
        },
        movementTabRow: {
            flexDirection: "row",
            paddingHorizontal: responsiveWidth(4),
            paddingTop: responsiveHeight(1.2),
            gap: responsiveWidth(2),
        },
        movementTabBtn: {
            flex: 1,
            alignItems: "center",
            paddingVertical: responsiveHeight(1),
            borderRadius: 8,
            backgroundColor: colors.surface ?? "#F3F4F6",
        },
        movementTabBtnActive: {
            backgroundColor: colors.primary,
        },
        movementTabText: {
            ...typography.body2,
            color: colors.text,
            fontWeight: "700",
        },
        movementTabTextActive: {
            color: colors.white,
        },
        movementModalBody: {
            flex: 1,
            marginTop: responsiveHeight(0.5),
        },
        movementModalListContent: {
            flexGrow: 1,
            paddingBottom: responsiveHeight(2),
        },
        outCard: {
            backgroundColor: colors.white,
            marginHorizontal: responsiveWidth(4),
            marginBottom: responsiveHeight(1),
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border ?? "#E5E7EB",
            overflow: "hidden",
        },
        outCardTitle: {
            ...typography.body2,
            color: colors.text,
            fontWeight: "700",
            flex: 1,
        },
        outCardTotal: {
            ...typography.body1,
            color: colors.accent,
            fontWeight: "800",
        },
        outTripHeader: {
            flexDirection: "row",
            alignItems: "center",
            gap: responsiveWidth(2),
            paddingHorizontal: responsiveWidth(3.5),
            paddingVertical: responsiveHeight(1.2),
        },
        movementsState: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: responsiveWidth(2),
            paddingVertical: responsiveHeight(1.6),
        },
        movementsEmptyText: {
            ...typography.caption,
            color: colors.textSecondary,
            textAlign: "center",
        },
        txRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: responsiveWidth(3.5),
            paddingVertical: responsiveHeight(1),
            borderBottomWidth: 1,
            borderBottomColor: colors.border ?? "#F3F4F6",
            gap: responsiveWidth(2),
        },
        txItemName: {
            ...typography.body2,
            color: colors.text,
            flex: 1,
        },
        directionBadge: {
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingHorizontal: responsiveWidth(2.5),
            paddingVertical: 4,
            borderRadius: 8,
            minWidth: responsiveWidth(14),
            justifyContent: "center",
        },
        directionText: {
            fontSize: 12,
            fontWeight: "700",
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
        list: {
            flex: 1,
            flexGrow: 1,
            backgroundColor: colors.white,
        },
        listContent: {
            paddingBottom: responsiveHeight(3),
            backgroundColor: colors.white,
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
            position: "relative",
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
            textAlign: "center",
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
        card: {
            backgroundColor: colors.white,
            marginHorizontal: responsiveWidth(4),
            marginTop: responsiveHeight(1),
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
            alignItems: "flex-start",
            paddingHorizontal: responsiveWidth(3.5),
            paddingTop: responsiveHeight(1.4),
            paddingBottom: responsiveHeight(1),
            borderBottomWidth: 1,
            borderBottomColor: colors.border ?? "#F3F4F6",
            gap: responsiveWidth(2),
        },
        itemName: {
            ...typography.body2,
            color: colors.text,
            fontWeight: "700",
            flex: 1,
        },
        badgeRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 5,
        },
        badge: {
            paddingHorizontal: responsiveWidth(2),
            paddingVertical: 2,
            borderRadius: 6,
        },
        badgeText: {
            fontSize: 11,
            fontWeight: "600",
        },
        balanceChip: {
            alignItems: "center",
            backgroundColor: colors.primary + "12",
            borderRadius: 10,
            paddingHorizontal: responsiveWidth(3),
            paddingVertical: responsiveHeight(0.8),
            minWidth: responsiveWidth(16),
        },
        balanceChipVal: {
            ...typography.body1,
            color: colors.primary,
            fontWeight: "800",
        },
        balanceChipLabel: {
            fontSize: 10,
            color: colors.primary,
            marginTop: 1,
        },
        statsRow: {
            flexDirection: "row",
            paddingHorizontal: responsiveWidth(2),
            paddingVertical: responsiveHeight(1.2),
        },
        statCell: {
            flex: 1,
            alignItems: "center",
        },
        borderLeft: {
            borderLeftWidth: 1,
            borderLeftColor: colors.border ?? "#F3F4F6",
        },
        statLabel: {
            fontSize: 10,
            color: colors.textSecondary,
            marginBottom: 3,
            textAlign: "center",
        },
        statValue: {
            ...typography.body2,
            color: colors.text,
            fontWeight: "700",
        },
        statAct: {
            fontSize: 10,
            color: colors.textSecondary,
            marginTop: 2,
        },
        chipScroll: {
            backgroundColor: colors.white,
            borderBottomWidth: 1,
            borderBottomColor: colors.border ?? "#E5E7EB",
        },
        chipScrollContent: {
            paddingHorizontal: responsiveWidth(4),
            paddingVertical: responsiveHeight(1.2),
            gap: responsiveWidth(2),
            backgroundColor: colors.white,
        },
        chip: {
            paddingHorizontal: responsiveWidth(3.5),
            paddingVertical: responsiveHeight(0.7),
            borderRadius: 20,
            backgroundColor: colors.surface ?? "#F3F4F6",
            borderWidth: 1,
            borderColor: colors.border ?? "#E5E7EB",
        },
        chipActive: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },
        chipText: {
            fontSize: 12,
            fontWeight: "600",
            color: colors.text,
        },
        chipTextActive: {
            color: colors.white,
        },
        tripwiseBanner: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginHorizontal: responsiveWidth(4),
            marginTop: responsiveHeight(1),
            paddingHorizontal: responsiveWidth(3),
            paddingVertical: responsiveHeight(0.8),
            borderRadius: 8,
            backgroundColor: colors.primary + "10",
        },
        tripwiseBannerText: {
            ...typography.caption,
            color: colors.primary,
            fontWeight: "600",
        },
    });
