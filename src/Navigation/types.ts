interface SaleOrderInvoiceParams {
    branchId: any;
}

interface SaleInvoiceParams {
    branchId: any;
}

interface PurchaseOrderParams {
    branchId: any;
}

interface paymentListParams {
    branchId: any;
}

interface receiptListParams  {
    branchId: any;
}

interface deliveryPendParams {
    branchId: any;
}

interface saleorderpendParams {
    branchId: any;
}

interface salependorderparams {
    branchId:any;
}

interface salependitemparams {
    branchId:any;
}

interface transactionparams {
    branchId:any;
}

interface debtorsparams {
    branchId:any;
}

interface expensesparams {
    branchId: any;
}

interface itemtransactionparams {
    ProductId: number;
    productName: string;
    fromDate: Date;
    toDate: Date;
}

interface godownitemparams {
    ProductId: number;
    GodownId: number;
    productName: string;
    fromDate: Date;
    toDate: Date;
}

interface godownItemWiseParams {
    godownId: string;
    godownName: string;
    fromDate: string;
    toDate: string;
    companyId: string;
}

export type BottomTabParamList = {
    Home: undefined;
    Attendance: undefined;
    Settings: undefined;
    Stock: undefined;
};

export type DrawerParamList = {
    HomeTab: undefined;
    Profile: undefined;
    CompanySwitch: undefined;

    invoiceSale: SaleInvoiceParams;
    saleOrderInvoice: undefined;
    Attendance: undefined;
};

export type RootStackParamList = {
    Splash: undefined;
    MainDrawer: undefined;
    Login: undefined;
    CompanySwitch: undefined;
    setting: undefined;
    profile: undefined;
    Home: undefined;

    saleOrderInvoice: SaleOrderInvoiceParams;
    invoiceSale: SaleInvoiceParams;
    purchaseOrder: PurchaseOrderParams;

    Stockitem:undefined;
    Stockgodown:undefined;
    ItemStack: undefined;
    GodownItemWise: godownItemWiseParams;
    Ratemaster: undefined,
    RatemasterAdmin: undefined,
    DeliveryFunnel: undefined,

    receiptList: receiptListParams;
    paymentList: paymentListParams;

    graphicalanalysis: undefined;
    ShetSheet: undefined;

    deliveryPend: deliveryPendParams;
    saleorderpend: saleorderpendParams;
    saleorderpendorder: salependorderparams;
    saleorderpenditem: salependitemparams;
    transaction: transactionparams;
    transactionlist: undefined;
    debtors: debtorsparams;
    expenses: expensesparams;
    transactionlistexp:undefined;
    transactionlistitem:itemtransactionparams;
    transactionlistgodownitem:godownitemparams;
    ShetSheetDetail: { item: any };
    // not used 
    Stock: undefined; // BottomTabParamList

};
