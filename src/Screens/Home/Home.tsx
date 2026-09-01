import {
    ScrollView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    RefreshControl,
    Pressable,
    Modal,
} from "react-native";
import React from "react";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";

import AppHeader from "../../Components/AppHeader";
import DatePickerButton from "../../Components/DatePickerButton";
import { useTheme } from "../../Context/ThemeContext";
import { fetchReceiptList } from "../../Api/receipt";
import { RootStackParamList } from "../../Navigation/types";
import { storage } from "../../constants/storage";
import { itemStockInfo, itemWiseStock } from "../../Api/OpeningStock";
import { responsiveHeight, responsiveWidth } from "../../constants/helper";
import {
    salesInvoice,
    salesOrderInvoice,
    salesOrderPendingList,
} from "../../Api/Sales";
import { getPurchaseOrderEntry } from "../../Api/Purchase";
import { API } from "../../constants/api";
import { fetchPaymentList } from "../../Api/payment";
import { DeliveryPendingList } from "../../Api/Sales";
import { getSalesGraph } from "../../Api/Dashboard";

const queryDefaults = {
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    retry: 1,
};

const formatDateLabel = (date: Date) =>
    date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

type Branch = {
    id: number;
    BranchName: string;
    HasAccess?: number;
    Created_by?: number;
    Created_at?: string;
};

const Home = () => {
    const { colors, typography } = useTheme();
    const styles = getStyles(typography, colors);
    const navigation =
        useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const insets = useSafeAreaInsets();

    // --- Read initial storage synchronously to avoid race with queries ---
    const initialCompanyId = storage.getString("companyId") ?? "";
    const initialUserId = storage.getString("userId") ?? "";
    const initialUserTypeId = storage.getString("userTypeId") ?? "";
    const ADMIN_USER_TYPES = ["0", "1", "2"];
    const QUICK_ACCESS_USER_TYPES = ["3", "6", "9"];
    const isAdmin = ADMIN_USER_TYPES.includes(initialUserTypeId);
    const isQuickAccessUser = QUICK_ACCESS_USER_TYPES.includes(initialUserTypeId);
    const enableDashboardQueries = !isQuickAccessUser;

    const quickStatusDate = React.useMemo(
        () =>
            new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
            }),
        [],
    );

    const quickStatusTime = React.useMemo(
        () =>
            new Date().toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            }),
        [],
    );

    const initialBranchId = storage.getString("branchId") ?? "";

    const [companyId, setCompanyId] = React.useState(initialCompanyId);
    const [userId, setUserId] = React.useState(initialUserId);
    const [branchId, setBranchId] = React.useState<string | number>(
        initialBranchId,
    );
    const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
    const [toDate, setToDate] = React.useState<Date>(new Date());
    const [refreshing, setRefreshing] = React.useState(false);
    const [getBranch, setGetBranch] = React.useState<Branch[]>([]);
    const [selectedBranches, setSelectedBranches] = React.useState<Branch[]>(
        [],
    );
    const [filterModalVisible, setFilterModalVisible] = React.useState(false);
    const today = new Date();
    const last30 = new Date();
    last30.setDate(today.getDate() - 30);

    const [pendingFromDate, setPendingFromDate] = React.useState(last30);
    const [pendingToDate, setPendingToDate] = React.useState(today);
    const [tempFromDate, setTempFromDate] = React.useState<Date>(selectedDate);
    const [tempToDate, setTempToDate] = React.useState<Date>(toDate);
    const [tempBranches, setTempBranches] = React.useState<Branch[]>([]);

    // Additional state to prevent overlapping loads
    const [branchLoading, setBranchLoading] = React.useState(false);
    const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({});
    const [selectedGroup, setSelectedGroup] = React.useState<string | null>(null);

    const getMonthRange = () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date();

        return {
            from: firstDay.toISOString().split("T")[0],
            to: lastDay.toISOString().split("T")[0],
        };
    };

    const { from, to } = getMonthRange();

    const { data: salesGraphData = [], isLoading: salesGraphLoading } =
        useQuery({
            queryKey: ["salesGraph", from, to, companyId],
            queryFn: () => getSalesGraph(from, to, Number(companyId)),
            ...queryDefaults,
            enabled: enableDashboardQueries && !!companyId,
        });

    // --- Branch fetch on mount (unchanged, but cancellable) ---
    React.useEffect(() => {
        const controller = new AbortController();

        const fetchBranches = async () => {
            const uId = storage.getString("userId");
            if (!uId) return;

            const url = API.getUserBranch(parseInt(uId, 10));
            try {
                const res = await fetch(url, { signal: controller.signal });
                if (!res.ok) throw new Error("Network response not ok");
                const json = await res.json();

                if (json.success && Array.isArray(json.data)) {
                    const accessibleBranches: Branch[] = json.data.filter(
                        (branch: Branch) => branch.HasAccess === 1,
                    );
                    setGetBranch(accessibleBranches);
                } else {
                    setGetBranch([]);
                }
            } catch (error: any) {
                if (error.name === "AbortError") {
                    // ignore
                } else {
                    console.error("Error fetching branches:", error);
                    setGetBranch([]);
                }
            }
        };

        fetchBranches();

        return () => controller.abort();
    }, []);

    const {
        data: saleOrderData = [],
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["saleOrder", selectedDate, toDate, userId, branchId],
        queryFn: () =>
            salesOrderInvoice(selectedDate, toDate, userId, branchId),
        ...queryDefaults,
        enabled:
            enableDashboardQueries &&
            expandedGroups["sales"] === true &&
            !!selectedDate &&
            !!toDate &&
            !!userId &&
            !!branchId,
    });

    const { data: invoiceData = [], refetch: refetchSalesinvoice } = useQuery({
        queryKey: ["invoiceData", selectedDate, toDate, userId, branchId],
        queryFn: () => salesInvoice(selectedDate, toDate, userId, branchId),
        ...queryDefaults,
        enabled:
            enableDashboardQueries &&
            expandedGroups["sales"] === true &&
            !!selectedDate &&
            !!toDate &&
            !!userId &&
            !!branchId,
    });

    const {
        data: purchaseOrderEntryData = [],
        refetch: refetchPurchaseOrderEntry,
    } = useQuery({
        queryKey: [
            "purchaseOrderEntryData",
            selectedDate,
            toDate,
            userId,
            branchId,
        ],
        queryFn: () =>
            getPurchaseOrderEntry(selectedDate, toDate, userId, Number(branchId)),
        ...queryDefaults,
        enabled:
            enableDashboardQueries &&
            expandedGroups["stock"] === true &&
            !!selectedDate &&
            !!toDate &&
            !!userId &&
            !!branchId,
    });

    const { data: itemStockValue = [], refetch: refetchItemStockValue } =
        useQuery({
            queryKey: ["itemStackValue", selectedDate],
            queryFn: () => itemStockInfo(selectedDate),
            ...queryDefaults,
            enabled: enableDashboardQueries && expandedGroups["stock"] === true && !!selectedDate,
        });

    const { data: receiptList = [], refetch: refetchReceiptList } = useQuery({
        queryKey: ["receiptList", selectedDate, toDate, userId, branchId],
        queryFn: () => fetchReceiptList(selectedDate, toDate, userId, branchId),
        ...queryDefaults,
        enabled:
            enableDashboardQueries &&
            expandedGroups["payment"] === true &&
            !!selectedDate &&
            !!toDate &&
            !!userId &&
            !!branchId,
    });

    const { data: paymentList = [], refetch: refetchPaymentList } = useQuery({
        queryKey: ["paymentList", selectedDate, toDate, userId, branchId],
        queryFn: () => fetchPaymentList(selectedDate, toDate, userId, branchId),
        ...queryDefaults,
        enabled:
            enableDashboardQueries &&
            expandedGroups["payment"] === true &&
            !!selectedDate &&
            !!toDate &&
            !!userId &&
            !!branchId,
    });

    const {
        data: DeliveryPendingData = [],
        refetch: refetchDeliveryPendingList,
    } = useQuery({
        queryKey: [
            "deliveryPendingList",
            selectedDate,
            toDate,
            userId,
            branchId,
        ],
        queryFn: () =>
            DeliveryPendingList(selectedDate, toDate, userId, branchId),
        ...queryDefaults,
        enabled:
            enableDashboardQueries &&
            expandedGroups["pending"] === true &&
            !!selectedDate &&
            !!toDate &&
            !!userId &&
            !!branchId,
    });

    const {
        data: SaleorderPendingData = [],
        refetch: refetchsalesOrderPendingList,
    } = useQuery({
        queryKey: [
            "salesorderPendingList",
            pendingFromDate,
            pendingToDate,
            userId,
            branchId,
        ],
        queryFn: () =>
            salesOrderPendingList(
                pendingFromDate,
                pendingToDate,
                userId,
                branchId,
            ),
        ...queryDefaults,
        enabled:
            enableDashboardQueries &&
            expandedGroups["pending"] === true &&
            !!pendingFromDate &&
            !!pendingToDate &&
            !!userId &&
            !!branchId,
    });

    // const {
    //   data: getRetailersList = [],
    //   refetch: refetchgetRetailersList,
    // } = useQuery ({
    //   queryKey: ["retailerList", selectedDate, toDate],
    //   queryFn: () => getRetailersList(selectedDate, toDate),
    //   enabled: !!selectedDate &&toDate,
    // });

    const { data: itemWiseStockData = [], refetch: refetchItemWise } = useQuery(
        {
            queryKey: ["itemWiseStock", selectedDate, toDate],
            queryFn: () => itemWiseStock(selectedDate, toDate),
            ...queryDefaults,
            enabled: enableDashboardQueries && expandedGroups["stock"] === true && !!selectedDate && !!toDate,
        },
    );

    const dayWiseData = React.useMemo(() => {
        if (!salesGraphData?.DayWise) return [];

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return salesGraphData.DayWise.filter((item: any) => {
            const d = new Date(item.Invoice_Date);
            return (
                d.getMonth() === currentMonth && d.getFullYear() === currentYear
            );
        });
    }, [salesGraphData]);

    const totalSales = React.useMemo(() => {
        return (saleOrderData || []).reduce(
            (acc: number, item: { Total_Invoice_value?: number }) =>
                acc + (item.Total_Invoice_value || 0),
            0,
        );
    }, [saleOrderData]);

    const totaldelPend = React.useMemo(() => {
        return (DeliveryPendingData || []).reduce(
            (acc: number, item: { Total_Invoice_value?: number }) =>
                acc + (item.Total_Invoice_value || 0),
            0,
        );
    }, [DeliveryPendingData]);

    const totalSalesPend = React.useMemo(() => {
        return (SaleorderPendingData || []).reduce(
            (acc: number, item: { Total_Invoice_value?: number }) =>
                acc + (item.Total_Invoice_value || 0),
            0,
        );
    }, [SaleorderPendingData]);

    const totalReceipt = React.useMemo(() => {
        return (receiptList || []).reduce(
            (acc: number, item: { credit_amount?: number }) =>
                acc + (item.credit_amount || 0),
            0,
        );
    }, [receiptList]);

    const totalPayment = React.useMemo(() => {
        return (paymentList || []).reduce(
            (acc: number, item: { credit_amount?: number }) =>
                acc + (item.credit_amount || 0),
            0,
        );
    }, [paymentList]);

    const totalInvoices = React.useMemo(() => {
        return (invoiceData || []).reduce(
            (acc: number, item: { Total_Invoice_value?: number }) =>
                acc + (item.Total_Invoice_value || 0),
            0,
        );
    }, [invoiceData]);

    const totalStockValue = React.useMemo(() => {
        return (itemStockValue || []).reduce(
            (acc: number, item: { CL_Value?: number }) =>
                acc + (item.CL_Value || 0),
            0,
        );
    }, [itemStockValue]);

    const totalItemWise = React.useMemo(() => {
        return (itemWiseStockData || []).reduce(
            (acc: number, item: { Product_Rate?: number }) =>
                acc + (item.Product_Rate || 0),
            0,
        );
    }, [itemWiseStockData]);

    const totalPurchaseOrderEntry = React.useMemo(() => {
        return (purchaseOrderEntryData || []).reduce(
            (acc: number, current: any) => {
                if (!current.ItemDetails || !Array.isArray(current.ItemDetails))
                    return acc;
                const itemsSum = current.ItemDetails.reduce(
                    (itemAcc: number, item: any) => {
                        return itemAcc + (item.Weight || 0) * (item.Rate || 0);
                    },
                    0,
                );
                return acc + itemsSum;
            },
            0,
        );
    }, [purchaseOrderEntryData]);

    const formatNumber = React.useCallback((num: number) => {
        if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
        if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    }, []);

    const totalGraphValue = React.useMemo(() => {
        return dayWiseData.reduce(
            (acc: number, item: any) => acc + (item.Total_Invoice_value || 0),
            0,
        );
    }, [dayWiseData]);

    const totalInvoiceCountMonth = React.useMemo(() => {
        return dayWiseData.reduce(
            (acc: number, item: any) => acc + (item.Invoice_Count || 0),
            0,
        );
    }, [dayWiseData]);

    const todayData = React.useMemo(() => {
        const now = new Date();
        return dayWiseData.find((item: any) => {
            const d = new Date(item.Invoice_Date);
            return (
                d.getDate() === now.getDate() &&
                d.getMonth() === now.getMonth() &&
                d.getFullYear() === now.getFullYear()
            );
        });
    }, [dayWiseData]);

    const toggleTempBranch = React.useCallback((branch: Branch) => {
        setTempBranches(prev => {
            const exists = prev.some(b => b.id === branch.id);
            if (exists) {
                return prev.filter(b => b.id !== branch.id);
            } else {
                return [...prev, branch];
            }
        });
    }, []);

    const toggleGroup = React.useCallback((key: string) => {
        setExpandedGroups(prev => ({ ...prev, [key]: true }));
        setSelectedGroup(key);
    }, []);

    const closeGroupSheet = React.useCallback(() => {
        setSelectedGroup(null);
    }, []);

    const openFilterModal = React.useCallback(() => {
        setTempFromDate(selectedDate);
        setTempToDate(toDate);
        setTempBranches(selectedBranches);
        setFilterModalVisible(true);
    }, [selectedBranches, selectedDate, toDate]);

    const applySelectedBranchesAndLoad = React.useCallback(async () => {
        setFilterModalVisible(false);

        setSelectedDate(tempFromDate);
        setToDate(tempToDate);
        setPendingFromDate(tempFromDate);
        setPendingToDate(tempToDate);

        let newBranchId = "";

        if (
            tempBranches.length === 0 ||
            tempBranches.length === getBranch.length
        ) {
            newBranchId = "";
        } else {
            newBranchId = tempBranches.map(b => b.id).join(",");
        }

        setSelectedBranches(tempBranches);
        setBranchId(newBranchId);

        if (newBranchId) {
            storage.set("branchId", newBranchId);
        } else {
            storage.remove("branchId");
        }

        if (branchLoading) return;
        setBranchLoading(true);

        try {
            // Refetch all queries
            const promises: Promise<any>[] = [];
            if (typeof refetch === "function") promises.push(refetch());
            if (typeof refetchSalesinvoice === "function")
                promises.push(refetchSalesinvoice());
            if (typeof refetchPurchaseOrderEntry === "function")
                promises.push(refetchPurchaseOrderEntry());
            if (typeof refetchItemStockValue === "function")
                promises.push(refetchItemStockValue());
            if (typeof refetchItemWise === "function")
                promises.push(refetchItemWise());
            if (typeof refetchReceiptList === "function")
                promises.push(refetchReceiptList());
            if (typeof refetchPaymentList === "function")
                promises.push(refetchPaymentList());
            if (typeof refetchDeliveryPendingList === "function")
                promises.push(refetchDeliveryPendingList());
            if (typeof refetchsalesOrderPendingList === "function")
                promises.push(refetchsalesOrderPendingList());

            await Promise.all(promises);
        } finally {
            setBranchLoading(false);
        }
    }, [
        tempFromDate,
        tempToDate,
        tempBranches,
        branchLoading,
        getBranch,
        refetch,
        refetchSalesinvoice,
        refetchPurchaseOrderEntry,
        refetchItemStockValue,
        refetchItemWise,
        refetchReceiptList,
        refetchPaymentList,
        refetchDeliveryPendingList,
        refetchsalesOrderPendingList,
    ]);

    const onRefresh = React.useCallback(async () => {
        if (isQuickAccessUser) return;
        setRefreshing(true);
        try {
            const p: Promise<any>[] = [];
            if (typeof refetch === "function") p.push(refetch());
            if (typeof refetchSalesinvoice === "function")
                p.push(refetchSalesinvoice());
            if (typeof refetchPurchaseOrderEntry === "function")
                p.push(refetchPurchaseOrderEntry());
            if (typeof refetchItemStockValue === "function")
                p.push(refetchItemStockValue());
            if (typeof refetchItemWise === "function")
                p.push(refetchItemWise());
            if (typeof refetchReceiptList === "function")
                p.push(refetchReceiptList());
            if (typeof refetchPaymentList === "function")
                p.push(refetchPaymentList());
            if (typeof refetchDeliveryPendingList === "function")
                p.push(refetchDeliveryPendingList());
            if (typeof refetchsalesOrderPendingList === "function")
                p.push(refetchsalesOrderPendingList());
            await Promise.all(p);
        } finally {
            setRefreshing(false);
        }
    }, [
        refetch,
        refetchSalesinvoice,
        refetchPurchaseOrderEntry,
        refetchItemStockValue,
        refetchItemWise,
        refetchReceiptList,
        refetchPaymentList,
        refetchDeliveryPendingList,
        refetchsalesOrderPendingList,
        isQuickAccessUser,
    ]);

    const groupedCards = React.useMemo(
        () => [
            {
                key: "sales",
                title: "Sales",
                icon: "trending-up",
                color: colors.primary,
                summary: `₹${formatNumber(totalSales + totalInvoices)}`,
                cards: [
                    {
                        key: "sale-orders",
                        title: "Sale Orders",
                        icon: "shopping-cart",
                        color: colors.primary,
                        value: `₹${formatNumber(totalSales)}`,
                        route: "saleOrderInvoice",
                        params: { branchId } as Record<string, string | number>,
                    },
                    {
                        key: "sale-invoices",
                        title: "Sale Invoices",
                        icon: "source",
                        color: colors.accent,
                        value: `₹${formatNumber(totalInvoices)}`,
                        route: "invoiceSale",
                        params: { branchId } as Record<string, string | number>,
                    },
                ],
            },
            {
                key: "stock",
                title: "Stock",
                icon: "inventory",
                color: colors.success,
                summary: `₹${formatNumber(totalStockValue)}`,
                cards: [
                    {
                        key: "purchase-orders",
                        title: "Purchase Orders",
                        icon: "assignment",
                        color: colors.info,
                        value: `₹${formatNumber(totalPurchaseOrderEntry)}`,
                        route: "purchaseOrder",
                        params: { branchId } as Record<string, string | number>,
                    },
                    // {
                    //     key: "stock-itemwise",
                    //     title: "Stock Itemwise",
                    //     icon: "inventory",
                    //     color: colors.success,
                    //     value: `₹${formatNumber(totalItemWise)}`,
                    //     route: "Stockitem",
                    //     params: undefined,
                    // },
                    {
                        key: "stock-godownwise",
                        title: "Stock Godownwise",
                        icon: "warehouse",
                        color: colors.sih,
                        value: `₹${formatNumber(totalItemWise)}`,
                        route: "Stockgodown",
                        params: undefined,
                    }
                ],
            },
            {
                key: "payment",
                title: "Payment",
                icon: "account-balance-wallet",
                color: colors.rec,
                summary: `₹${formatNumber(totalReceipt + totalPayment)}`,
                cards: [
                    {
                        key: "receipt",
                        title: "Receipt",
                        icon: "receipt",
                        color: colors.rec,
                        value: `₹${formatNumber(totalReceipt)}`,
                        route: "receiptList",
                        params: { branchId } as Record<string, string | number>,
                    },
                    {
                        key: "payment-entry",
                        title: "Payment",
                        icon: "payment",
                        color: colors.pay,
                        value: `₹${formatNumber(totalPayment)}`,
                        route: "paymentList",
                        params: { branchId } as Record<string, string | number>,
                    },
                    {
                        key: "transaction",
                        title: "Transaction",
                        icon: "sync-alt",
                        color: colors.tran,
                        value: "--",
                        route: "transaction",
                        params: { branchId } as Record<string, string | number>,
                    },
                    {
                        key: "debtors",
                        title: "Sundry DEB & CRE",
                        icon: "credit-card-off",
                        color: colors.deb,
                        value: "--",
                        route: "debtors",
                        params: { branchId } as Record<string, string | number>,
                    },
                    {
                        key: "expenses",
                        title: "Expenses",
                        icon: "money",
                        color: colors.exp,
                        value: "--",
                        route: "expenses",
                        params: { branchId } as Record<string, string | number>,
                    },
                ],
            },
            {
                key: "pending",
                title: "Pending",
                icon: "pending-actions",
                color: colors.pen,
                summary: `₹${formatNumber(totaldelPend + totalSalesPend)}`,
                cards: [
                    {
                        key: "delivery",
                        title: "Delivery",
                        icon: "delivery-dining",
                        color: colors.del,
                        value: `₹${formatNumber(totaldelPend)}`,
                        route: "deliveryPend",
                        params: { branchId } as Record<string, string | number>,
                    },
                    {
                        key: "sales-pending-order",
                        title: "Sales Pending Order",
                        icon: "shopping-cart",
                        color: colors.pen,
                        value: `₹${formatNumber(totalSalesPend)}`,
                        route: "saleorderpendorder",
                        params: { branchId } as Record<string, string | number>,
                    },
                    {
                        key: "sales-pending-item",
                        title: "Sales Pending Item",
                        icon: "pending-actions",
                        color: colors.peni,
                        value: `₹${formatNumber(totalSalesPend)}`,
                        route: "saleorderpenditem",
                        params: { branchId } as Record<string, string | number>,
                    },
                ],
            },
            {
                key: "report",
                title: "Reports",
                icon: "insert-drive-file",
                color: colors.sih,
                summary: "--",
                cards: [
                    {
                        key: "item-stock-value",
                        title: "InStock Report",
                        icon: "shopify",
                        color: colors.success,
                        // value: `₹${formatNumber(totalStockValue)}`,
                        route: "ItemStack",
                        params: undefined,
                    },
                    {
                        key: "rate-master",
                        title: "Rate Master",
                        icon: "description",
                        color: colors.accent,
                        // value: "",
                        route: "Ratemaster",
                        params: undefined,
                    },
                    {
                        key: "rate-master-admin",
                        title: "Rate Master Admin",
                        icon: "description",
                        color: colors.deb,
                        // value: "",
                        route: "RatemasterAdmin",
                        params: undefined,
                    },
                    {
                        key: "delivery-funnel",
                        title: "Delivery Funnel",
                        icon: "description",
                        color: colors.success,
                        // value: "",
                        route: "DeliveryFunnel",
                        params: undefined,
                    },
                ],
            },
            {
                key: "other",
                title: "Others",
                icon: "description",
                color: colors.exp,
                summary: "--",
                cards: [
                    {
                        key: "shet-sheet",
                        title: "Shet Sheet",
                        icon: "description",
                        color: colors.exp,
                        value: "--",
                        route: "ShetSheet",
                        params: undefined,
                    },
                ],
            },
        ],
        [
            branchId,
            colors,
            formatNumber,
            totalSales,
            totalInvoices,
            totalPurchaseOrderEntry,
            totalItemWise,
            totalReceipt,
            totalPayment,
            totaldelPend,
            totalSalesPend,
            totalStockValue,
        ],
    );

    const navigateCard = React.useCallback(
        (route: string, params?: Record<string, string | number>) => {
            const nav = navigation as any;
            if (params) {
                nav.navigate(route, params);
                return;
            }
            nav.navigate(route);
        },
        [navigation],
    );

    return (
        <SafeAreaView style={[styles.container]} edges={["top"]}>
            <AppHeader
                navigation={navigation}
                showDrawer={true}
                name={storage.getString("name")}
                subtitle={storage.getString("companyName")}
                showRightIcon={!isQuickAccessUser && isAdmin}
                rightIconLibrary="MaterialIcon"
                rightIconName="compare-arrows"
                onRightPress={() => navigation.navigate("CompanySwitch")}
                showRightIcon2={!isQuickAccessUser}
                rightIconLibrary2="MaterialIcon"
                rightIconName2="filter-list"
                onRightPress2={openFilterModal}
            />
            <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ flex: 1, backgroundColor: colors.background }}
                refreshControl={
                    isQuickAccessUser ? undefined : (
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                        />
                    )
                }
            >
                {isQuickAccessUser ? (
                    <>
                        <View style={styles.quickStatusCard}>
                            <View style={styles.quickStatusLeft}>
                                <Text style={styles.quickStatusDate}>
                                    {quickStatusDate}
                                </Text>
                                <Text style={styles.quickStatusTitle}>
                                    Not punched in
                                </Text>
                            </View>
                            <View style={styles.quickStatusRight}>
                                <Text style={styles.quickStatusTime}>
                                    {quickStatusTime}
                                </Text>
                                <Text style={styles.quickStatusShift}>
                                    Shift 09:30-18:30
                                </Text>
                            </View>
                        </View>

                        <View style={styles.quickSection}>
                            <Text style={styles.quickSectionTitle}>Quick Access</Text>

                            <View style={styles.quickGrid}>
                                <View style={styles.quickGridItem}>
                                    <View style={styles.quickCard}>
                                        <View
                                            style={[
                                                styles.quickIconBox,
                                                { backgroundColor: "#E7EEF7" },
                                            ]}>
                                            <Text style={styles.quickIconText}>🗒️</Text>
                                        </View>
                                        <Text style={styles.quickCardTitle}>
                                            Attendance
                                        </Text>
                                        <Text style={styles.quickCardSubtitle}>
                                            Coming soon
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.quickGridItem}>
                                    <View style={styles.quickCard}>
                                        <View
                                            style={[
                                                styles.quickIconBox,
                                                { backgroundColor: "#EDE3F8" },
                                            ]}>
                                            <Text style={styles.quickIconText}>✅</Text>
                                        </View>
                                        <Text style={styles.quickCardTitle}>Task</Text>
                                        <Text style={styles.quickCardSubtitle}>
                                            Coming soon
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.quickGridItem}>
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        style={styles.quickCard}
                                        onPress={() => navigation.navigate("ShetSheet")}>
                                        <View
                                            style={[
                                                styles.quickIconBox,
                                                { backgroundColor: "#F3E4DC" },
                                            ]}>
                                            <Text style={styles.quickIconText}>📄</Text>
                                        </View>
                                        <Text style={styles.quickCardTitle}>
                                            Shet Sheet Upload
                                        </Text>
                                        <Text style={styles.quickCardSubtitle}>
                                            Upload daily sheet
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.quickGridItem}>
                                    <View style={styles.quickCard}>
                                        <View
                                            style={[
                                                styles.quickIconBox,
                                                { backgroundColor: "#DEEEDF" },
                                            ]}>
                                            <Text style={styles.quickIconText}>👥</Text>
                                        </View>
                                        <Text style={styles.quickCardTitle}>
                                            Staff Report
                                        </Text>
                                        <Text style={styles.quickCardSubtitle}>
                                            Coming soon
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </>
                ) : (
                    <>
                        <View style={styles.activeFilterBar}>
                            <Icon name="date-range" size={14} color={colors.primary} />
                            <Text style={styles.activeFilterText}>
                                {formatDateLabel(selectedDate)} - {formatDateLabel(toDate)}
                            </Text>
                            {selectedBranches.length > 0 && (
                                <>
                                    <View style={styles.activeFilterDot} />
                                    <Icon name="store" size={14} color={colors.primary} />
                                    <Text style={styles.activeFilterText}>
                                        {selectedBranches.map(b => b.BranchName).join(", ")}
                                    </Text>
                                </>
                            )}
                            <TouchableOpacity
                                style={styles.activeFilterRefresh}
                                onPress={onRefresh}>
                                <Icon name="refresh" size={16} color={colors.white} />
                            </TouchableOpacity>
                        </View>

                        <Modal
                            visible={filterModalVisible}
                            transparent
                            animationType="slide"
                            onRequestClose={() => setFilterModalVisible(false)}>
                            <View style={styles.filterModalOverlay}>
                                <View style={styles.filterModalSheet}>
                                    <View style={styles.filterSheetHandle} />

                                    <View style={styles.filterSheetHeader}>
                                        <Text style={styles.filterSheetTitle}>Filters</Text>
                                        <TouchableOpacity
                                            onPress={() => setFilterModalVisible(false)}
                                            hitSlop={{
                                                top: 10,
                                                bottom: 10,
                                                left: 10,
                                                right: 10,
                                            }}>
                                            <Icon
                                                name="close"
                                                size={22}
                                                color={colors.textSecondary}
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={styles.filterSectionLabel}>Date Range</Text>
                                    <View style={styles.filterDateRow}>
                                        <View style={styles.filterDateCell}>
                                            <Text style={styles.filterDateCellLabel}>From</Text>
                                            <DatePickerButton
                                                date={tempFromDate}
                                                maxDate={new Date()}
                                                onDateChange={setTempFromDate}
                                                containerStyle={styles.filterDatePickerContainer}
                                            />
                                        </View>
                                        <Icon
                                            name="trending-flat"
                                            size={18}
                                            color={colors.textSecondary}
                                            style={styles.filterDateArrow}
                                        />
                                        <View style={styles.filterDateCell}>
                                            <Text style={styles.filterDateCellLabel}>To</Text>
                                            <DatePickerButton
                                                date={tempToDate}
                                                maxDate={new Date()}
                                                onDateChange={setTempToDate}
                                                containerStyle={styles.filterDatePickerContainer}
                                            />
                                        </View>
                                    </View>

                                    <Text style={styles.filterSectionLabel}>Branches</Text>
                                    <ScrollView
                                        style={styles.filterBranchList}
                                        showsVerticalScrollIndicator={false}>
                                        {getBranch.map(branch => {
                                            const isSelected = tempBranches.some(
                                                b => b.id === branch.id,
                                            );
                                            return (
                                                <TouchableOpacity
                                                    key={branch.id}
                                                    style={styles.filterBranchItem}
                                                    activeOpacity={0.7}
                                                    onPress={() => toggleTempBranch(branch)}>
                                                    <Icon
                                                        name={
                                                            isSelected
                                                                ? "check-box"
                                                                : "check-box-outline-blank"
                                                        }
                                                        size={22}
                                                        color={colors.primary}
                                                    />
                                                    <Text style={styles.filterBranchName}>
                                                        {branch.BranchName}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>

                                    <TouchableOpacity
                                        style={[
                                            styles.filterApplyBtn,
                                            branchLoading && { opacity: 0.6 },
                                        ]}
                                        onPress={applySelectedBranchesAndLoad}
                                        disabled={branchLoading}>
                                        <Text style={styles.filterApplyText}>
                                            {branchLoading ? "Applying..." : "Apply Filters"}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Modal>

                        <View style={styles.graphCardContainer}>
                            <Pressable
                                onPress={() => navigation.navigate("graphicalanalysis")}
                            >
                                <View style={styles.graphCard}>
                                    <Text style={styles.graphTitle}>
                                        This Month Sales
                                    </Text>
                                    <View style={styles.graphStatsRow}>
                                        <View style={styles.graphStatBlock}>
                                            <Text style={styles.graphStatLabel}>Today</Text>
                                            <Text style={styles.graphStatValue}>
                                                ₹{formatNumber(todayData?.Total_Invoice_value ?? 0)}
                                            </Text>
                                            <Text style={styles.graphStatSub}>
                                                {todayData?.Invoice_Count ?? 0} Invoices
                                            </Text>
                                        </View>
                                        <View style={styles.graphStatDivider} />
                                        <View style={styles.graphStatBlock}>
                                            <Text style={styles.graphStatLabel}>This Month</Text>
                                            <Text style={[styles.graphStatValue, { color: colors.primary }]}>
                                                ₹{formatNumber(totalGraphValue)}
                                            </Text>
                                            <Text style={styles.graphStatSub}>
                                                {totalInvoiceCountMonth} Invoices
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </Pressable>
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

                            {/* 3-column group category tiles */}
                            <View style={styles.groupTileGrid}>
                                {groupedCards.map(group => (
                                    <TouchableOpacity
                                        key={group.key}
                                        style={[
                                            styles.groupTile,
                                            selectedGroup === group.key && {
                                                borderColor: group.color,
                                            },
                                        ]}
                                        activeOpacity={0.75}
                                        onPress={() => toggleGroup(group.key)}>
                                        <View
                                            style={[
                                                styles.groupTileIconBox,
                                                { backgroundColor: group.color + "18" },
                                            ]}>
                                            <Icon
                                                name={group.icon}
                                                size={22}
                                                color={group.color}
                                            />
                                        </View>
                                        <Text
                                            style={styles.groupTileTitle}
                                            numberOfLines={1}>
                                            {group.title}
                                        </Text>
                                        {/* <Text
                                            style={[
                                                styles.groupTileSummary,
                                                { color: group.color },
                                            ]}
                                            numberOfLines={1}>
                                            {group.summary}
                                        </Text> */}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Group detail bottom sheet */}
                        <Modal
                            visible={selectedGroup !== null}
                            transparent
                            animationType="slide"
                            onRequestClose={closeGroupSheet}>
                            <Pressable
                                style={styles.groupSheetOverlay}
                                onPress={closeGroupSheet}>
                                <View
                                    style={[
                                        styles.groupSheetContainer,
                                        { paddingBottom: insets.bottom + 12 },
                                    ]}
                                    onStartShouldSetResponder={() => true}>
                                    <View style={styles.groupSheetHandle} />
                                    {groupedCards
                                        .filter(g => g.key === selectedGroup)
                                        .map(activeGroup => (
                                            <React.Fragment key={activeGroup.key}>
                                                <View
                                                    style={styles.groupSheetHeader}>
                                                    <Text style={styles.groupSheetTitle}>
                                                        {activeGroup.title}
                                                    </Text>
                                                    <TouchableOpacity
                                                        onPress={closeGroupSheet}
                                                        hitSlop={{
                                                            top: 10,
                                                            bottom: 10,
                                                            left: 10,
                                                            right: 10,
                                                        }}>
                                                        <Icon
                                                            name="close"
                                                            size={22}
                                                            color={colors.textSecondary}
                                                        />
                                                    </TouchableOpacity>
                                                </View>
                                                <View style={styles.groupSheetBody}>
                                                    <View style={styles.groupSheetCardGrid}>
                                                        {activeGroup.cards.map(card => (
                                                            <Pressable
                                                                key={card.key}
                                                                style={styles.summaryGridItem}
                                                                onPress={() => {
                                                                    closeGroupSheet();
                                                                    navigateCard(
                                                                        card.route,
                                                                        card.params,
                                                                    );
                                                                }}>
                                                                <View
                                                                    style={[
                                                                        styles.summaryCard,
                                                                        { borderTopColor: card.color },
                                                                    ]}>
                                                                    <Icon
                                                                        name={card.icon}
                                                                        size={24}
                                                                        color={card.color}
                                                                    />
                                                                    <Text
                                                                        style={styles.summaryCardTitle}
                                                                        numberOfLines={2}>
                                                                        {card.title}
                                                                    </Text>
                                                                    <Text
                                                                        style={styles.summaryCardValue}
                                                                        numberOfLines={1}>
                                                                        {card.value}
                                                                    </Text>
                                                                </View>
                                                            </Pressable>
                                                        ))}
                                                    </View>
                                                </View>
                                            </React.Fragment>
                                        ))}
                                </View>
                            </Pressable>
                        </Modal>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default Home;

const getStyles = (typography: any, colors: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.primary,
        },

        quickStatusCard: {
            marginHorizontal: responsiveWidth(3),
            marginTop: responsiveHeight(2),
            backgroundColor: colors.primary,
            borderRadius: 24,
            paddingHorizontal: responsiveWidth(5),
            paddingVertical: responsiveHeight(2),
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
        },
        quickStatusLeft: {
            flex: 1,
            paddingRight: 8,
        },
        quickStatusDate: {
            ...typography.body2,
            color: colors.white,
            opacity: 0.95,
            fontWeight: "700",
            marginBottom: 4,
        },
        quickStatusTitle: {
            ...typography.h3,
            color: colors.white,
            fontWeight: "800",
        },
        quickStatusRight: {
            alignItems: "flex-end",
        },
        quickStatusTime: {
            ...typography.h1,
            color: colors.white,
            fontWeight: "800",
        },
        quickStatusShift: {
            ...typography.body2,
            color: colors.white,
            opacity: 0.85,
        },
        quickSection: {
            marginTop: responsiveHeight(2.2),
            paddingHorizontal: responsiveWidth(3),
            paddingBottom: responsiveHeight(3),
        },
        quickSectionTitle: {
            ...typography.h2,
            color: colors.text,
            fontWeight: "800",
            marginBottom: responsiveHeight(1.8),
        },
        quickGrid: {
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            rowGap: responsiveWidth(4),
        },
        quickGridItem: {
            width: "48%",
        },
        quickCard: {
            backgroundColor: colors.white,
            borderRadius: 20,
            minHeight: responsiveHeight(19),
            paddingHorizontal: responsiveWidth(3.2),
            paddingVertical: responsiveHeight(2.2),
            alignItems: "center",
            justifyContent: "center",
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.08,
            shadowRadius: 6,
            elevation: 3,
        },
        quickIconBox: {
            width: responsiveWidth(16),
            height: responsiveWidth(16),
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: responsiveHeight(1.4),
        },
        quickIconText: {
            fontSize: 28,
        },
        quickCardTitle: {
            ...typography.h4,
            color: colors.text,
            textAlign: "center",
            fontWeight: "800",
            marginBottom: 6,
        },
        quickCardSubtitle: {
            ...typography.body1,
            color: colors.textSecondary,
            fontWeight: "600",
            textAlign: "center",
        },

        activeFilterBar: {
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 6,
            backgroundColor: colors.white,
            marginHorizontal: responsiveWidth(3),
            marginTop: 8,
            marginBottom: 6,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 8,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.07,
            shadowRadius: 3,
            elevation: 2,
        },
        activeFilterText: {
            ...typography.caption,
            color: colors.primary,
            fontWeight: "600",
            flexShrink: 1,
        },
        activeFilterDot: {
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.textSecondary,
        },
        activeFilterRefresh: {
            marginLeft: "auto" as any,
            backgroundColor: colors.primary,
            padding: 5,
            borderRadius: 6,
        },
        filterModalOverlay: {
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "flex-end",
        },
        filterModalSheet: {
            backgroundColor: colors.white,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 16,
            paddingBottom: 24,
            maxHeight: "85%",
        },
        filterSheetHandle: {
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.border ?? "#E5E7EB",
            alignSelf: "center",
            marginTop: 10,
            marginBottom: 6,
        },
        filterSheetHeader: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 10,
            borderBottomWidth: 0.5,
            borderColor: colors.border ?? "#E5E7EB",
            marginBottom: 14,
        },
        filterSheetTitle: {
            ...typography.h6,
            fontWeight: "700",
            color: colors.text,
        },
        filterSectionLabel: {
            ...typography.caption,
            color: colors.textSecondary,
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: 0.8,
            marginBottom: 8,
        },
        filterDateRow: {
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 18,
        },
        filterDateCell: {
            flex: 1,
        },
        filterDateCellLabel: {
            ...typography.caption,
            color: colors.textSecondary,
            marginBottom: 4,
            fontWeight: "600",
        },
        filterDatePickerContainer: {
            marginBottom: 0,
        },
        filterDateArrow: {
            marginHorizontal: 8,
            marginTop: 16,
        },
        filterBranchList: {
            maxHeight: responsiveHeight(25),
            marginBottom: 16,
        },
        filterBranchItem: {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 9,
            borderBottomWidth: 0.5,
            borderColor: colors.border ?? "#E5E7EB",
            gap: 10,
        },
        filterBranchName: {
            ...typography.body1,
            color: colors.text,
            flex: 1,
        },
        filterApplyBtn: {
            backgroundColor: colors.primary,
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: "center",
        },
        filterApplyText: {
            color: colors.white,
            fontWeight: "700",
            fontSize: 15,
        },

        datePickerContainer: {
            paddingHorizontal: responsiveWidth(4),
            paddingVertical: responsiveWidth(2),
            backgroundColor: colors.white,
            borderRadius: 12,
            marginHorizontal: responsiveWidth(4),
            marginTop: responsiveWidth(4),
            marginBottom: responsiveWidth(2),
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
            marginHorizontal: responsiveWidth(4),
            marginVertical: responsiveWidth(2),
        },
        datePickerRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: responsiveWidth(3),
            justifyContent: "space-between",
        },
        dateInfoContainer: {
            marginTop: responsiveWidth(2),
            alignItems: "center",
        },
        dateInfoText: {
            ...typography.caption,
            color: colors.textSecondary,
            fontStyle: "italic",
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
            flex: 1,
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

        // Summary Section
        summarySection: {
            paddingHorizontal: responsiveWidth(3),
            paddingBottom: responsiveHeight(2),
        },
        summaryGrid: {
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            rowGap: responsiveWidth(3),
        },
        summaryGridItem: {
            width: "24.8%",
            marginHorizontal: responsiveWidth(2.2),
        },
        summaryCard: {
            backgroundColor: colors.white,
            borderRadius: 12,
            paddingHorizontal: responsiveWidth(1.2),
            paddingVertical: responsiveWidth(2.2),
            alignItems: "center",
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 3,
            minHeight: responsiveHeight(12),
            justifyContent: "space-between",
            borderTopWidth: 2,
            borderTopColor: colors.border ?? colors.primary,
        },
        summaryCardTitle: {
            ...typography.caption,
            color: colors.textSecondary,
            textAlign: "center",
            marginTop: responsiveWidth(1),
            marginBottom: responsiveWidth(0.8),
            fontWeight: "600",
            lineHeight: 14,
        },
        summaryCardValue: {
            ...typography.body2,
            color: colors.textDark,
            fontWeight: "700",
            textAlign: "center",
            marginBottom: 0,
        },
        changeContainer: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: responsiveWidth(3),
            gap: responsiveWidth(1.5),
            backgroundColor: colors.surface,
            borderRadius: 20,
            paddingHorizontal: responsiveWidth(3),
            paddingVertical: responsiveWidth(1.5),
            shadowColor: colors.black + "50",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 2,
            elevation: 2,
        },
        changeText: {
            ...typography.body2,
            fontWeight: "700",
        },
        tonnageContainer: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: responsiveWidth(1),
            gap: responsiveWidth(0.5),
            borderRadius: 8,
            paddingHorizontal: responsiveWidth(1.5),
            paddingVertical: responsiveWidth(0.5),
        },
        tonnageText: {
            ...typography.caption,
            fontWeight: "600",
            fontSize: 11,
        },
        branchSection: {
            marginVertical: 12,
            paddingHorizontal: 10,
        },

        branchCardFull: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.cardBackground || "#fff",
            borderRadius: 16,
            padding: 16,
            elevation: 3,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            width: "100%", // full width
            marginBottom: 10,
        },

        branchCardTextContainer: {
            flex: 1,
            marginLeft: 12,
        },

        branchCardTitle: {
            fontSize: 16,
            color: colors.text,
            fontWeight: "600",
            marginBottom: 4,
        },

        branchCardValue: {
            fontSize: 15,
            color: colors.primary,
            flexWrap: "wrap",
        },

        modalOverlay: {
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
        },

        modalContainer: {
            width: "90%",
            maxHeight: "80%",
            backgroundColor: colors.cardBackground || "#fff",
            borderRadius: 16,
            padding: 20,
        },

        modalTitle: {
            fontSize: 18,
            fontWeight: "600",
            marginBottom: 10,
            color: colors.text,
        },

        branchList: {
            marginVertical: 10,
        },

        branchItem: {
            paddingVertical: 10,
            borderBottomWidth: 0.5,
            borderColor: colors.border || "#ddd",
        },

        checkboxContainer: {
            flexDirection: "row",
            alignItems: "center",
        },

        branchName: {
            marginLeft: 10,
            fontSize: 16,
            color: colors.text,
        },

        doneButton: {
            backgroundColor: colors.primary,
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: "center",
            marginTop: 12,
        },

        doneButtonText: {
            color: colors.white,
            fontWeight: "600",
            fontSize: 16,
        },
        dateWrapper: {
            flex: 1,
            marginRight: 8,
        },

        refreshButtonSmall: {
            backgroundColor: colors.primary,
            padding: 10,
            borderRadius: 8,
            justifyContent: "center",
            alignItems: "center",
        },

        graphCardContainer: {
            paddingHorizontal: 16,
            marginTop: 10,
        },

        graphCard: {
            backgroundColor: colors.cardBackground || "#fff",
            borderRadius: 20,
            padding: 16,
            borderWidth: 2,
            borderColor: colors.border || "#e0e0e0",
        },

        graphTitle: {
            fontSize: 13,
            color: colors.textSecondary,
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: 0.6,
            marginBottom: responsiveHeight(1.2),
        },
        graphStatsRow: {
            flexDirection: "row",
            alignItems: "center",
        },
        graphStatBlock: {
            flex: 1,
            alignItems: "center",
        },
        graphStatDivider: {
            width: 1,
            height: responsiveHeight(6),
            backgroundColor: colors.border ?? "#E5E7EB",
            marginHorizontal: responsiveWidth(2),
        },
        graphStatLabel: {
            fontSize: 12,
            color: colors.textSecondary,
            fontWeight: "600",
            marginBottom: 4,
        },
        graphStatValue: {
            fontSize: 20,
            fontWeight: "800",
            color: colors.text,
            marginBottom: 3,
        },
        graphStatSub: {
            fontSize: 12,
            color: colors.textSecondary,
        },

        graphValue: {
            fontSize: 22,
            fontWeight: "bold",
            color: colors.primary,
        },

        graphSub: {
            fontSize: 12,
            color: colors.textSecondary,
        },

        // Group tile grid (3-column)
        groupTileGrid: {
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            rowGap: responsiveWidth(3),
            marginBottom: responsiveHeight(1.5),
        },
        groupTile: {
            width: "31.8%",
            backgroundColor: colors.white,
            borderRadius: 14,
            paddingHorizontal: responsiveWidth(2),
            paddingVertical: responsiveHeight(1.5),
            alignItems: "center",
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.07,
            shadowRadius: 4,
            elevation: 2,
            borderWidth: 2,
            borderColor: "transparent",
        },
        groupTileIconBox: {
            width: responsiveWidth(12),
            height: responsiveWidth(12),
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: responsiveHeight(0.8),
        },
        groupTileTitle: {
            ...typography.body2,
            color: colors.text,
            fontWeight: "700",
            textAlign: "center",
            marginBottom: 3,
        },
        groupTileSummary: {
            ...typography.caption,
            fontWeight: "600",
            textAlign: "center",
        },
        // Expanded detail panel below the tile grid
        expandedSection: {
            marginBottom: responsiveHeight(1.2),
            backgroundColor: colors.white,
            borderRadius: 14,
            overflow: "hidden",
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.07,
            shadowRadius: 4,
            elevation: 2,
        },
        expandedSectionHeader: {
            paddingHorizontal: responsiveWidth(3.5),
            paddingVertical: responsiveHeight(1.2),
            borderLeftWidth: 4,
        },
        expandedSectionTitle: {
            ...typography.h4,
            color: colors.text,
            fontWeight: "700",
        },
        groupCardGrid: {
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            paddingHorizontal: responsiveWidth(2),
            paddingTop: responsiveWidth(1.5),
            paddingBottom: responsiveWidth(2),
            rowGap: responsiveWidth(2),
            borderTopWidth: 0.5,
            borderTopColor: colors.border ?? "#E5E7EB",
        },

        // Group bottom sheet styles
        groupSheetOverlay: {
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "flex-end",
        },
        groupSheetContainer: {
            backgroundColor: colors.white,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: responsiveWidth(4),
            height: "55%",
            overflow: "hidden",
        },
        groupSheetHandle: {
            width: responsiveWidth(10),
            height: 4,
            borderRadius: 2,
            backgroundColor: colors.border ?? "#D1D5DB",
            alignSelf: "center",
            marginTop: responsiveHeight(1.2),
            marginBottom: responsiveHeight(0.8),
        },
        groupSheetHeader: {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: responsiveHeight(1.2),
            paddingLeft: 12,
            marginBottom: responsiveHeight(1.5),
            borderRadius: 8,
            gap: 10,
        },
        groupSheetTitle: {
            ...typography.h4,
            color: colors.text,
            fontWeight: "700",
            flex: 1,
        },
        groupSheetBody: {
            flexGrow: 0,
        },
        groupSheetCardGrid: {
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            rowGap: responsiveWidth(3),
            paddingBottom: 8,
        },
    });
