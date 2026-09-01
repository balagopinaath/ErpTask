import { API } from "../constants/api";

// Instock API Fetches

export const fetchInStockReport = async (
    predate: Date | string,
    fromdate: Date | string,
    todate: Date | string,
    company_id: number | string,
) => {
    try {
        const preStr =
            typeof predate === "string"
                ? predate
                : predate.toISOString().split("T")[0];

        const fromStr =
            typeof fromdate === "string"
                ? fromdate
                : fromdate.toISOString().split("T")[0];

        const toStr =
            typeof todate === "string"
                ? todate
                : todate.toISOString().split("T")[0];

        const url = API.reportApi(
            `reports/externalAPI/godownSummaryInstock?Predate=${encodeURIComponent(
                preStr,
            )}&from=${encodeURIComponent(fromStr)}&to=${encodeURIComponent(
                toStr,
            )}&company_id=${encodeURIComponent(String(company_id))}`,
        );

        console.log("In Stock Report URL:", url);

        const res = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const json = await res.json();

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        if (!json.success) {
            throw new Error(json.message || "Failed to fetch in-stock report");
        }

        return json.data || [];
    } catch (error) {
        console.error("Error fetching in-stock report:", error);
        throw error;
    }
};

export const fetchGodownItemWise = async (
    godownId: string | number,
    fromdate: string,
    todate: string,
    company_id: string | number,
) => {
    try {
        const url = API.reportApi(
            `reports/storageStock/godownitemWise?Godown_Id=${encodeURIComponent(
                String(godownId),
            )}&Fromdate=${encodeURIComponent(
                fromdate,
            )}&Todate=${encodeURIComponent(
                todate,
            )}&company_id=${encodeURIComponent(String(company_id))}`,
        );

        const res = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        const json = await res.json();

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        if (!json.success) {
            throw new Error(
                json.message || "Failed to fetch godown item wise data",
            );
        }

        return json.data || [];
    } catch (error) {
        console.error("Error fetching godown item wise:", error);
        throw error;
    }
};

export const fetchGodownTransactions = async (
    godownId: string | number,
    fromdate: string,
    todate: string,
    company_id: string | number,
) => {
    try {
        const url = API.reportApi(
            `reports/externalAPI/stockinoutprocess?Fromdate=${encodeURIComponent(
                fromdate,
            )}&Todate=${encodeURIComponent(
                todate,
            )}&company_id=${encodeURIComponent(String(company_id))}`,
        );

        const res = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        const json = await res.json();

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        if (!json.success) {
            throw new Error(
                json.message || "Failed to fetch godown transactions",
            );
        }

        const all = (json.transactions ?? json.data) || [];

        return all.filter(
            (tx: { godown_id: string | number }) =>
                String(tx.godown_id) === String(godownId),
        );
    } catch (error) {
        console.error("Error fetching godown transactions:", error);
        throw error;
    }
};

// Godown Master Data

export const fetchGodown = async (
    company_id: string | number,
) => {
    try {
        const url = API.reportApi(
            `masters/godown?company_id=${encodeURIComponent(
                String(company_id),
            )}`,
        );

        const res = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        const json = await res.json();

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        if (!json.success) {
            throw new Error(json.message || "Failed to fetch godown list");
        }

        return json.data || [];
    } catch (error) {
        console.error("Error fetching godown list:", error);
        throw error;
    }
};

// Delivery Funnel API Fetches

export const fetchDeliveryFunnel = async (
    fromdate: string,
    todate: string,
    company_id: string | number,
    godownId?: string | number,
) => {
    try {
        const godownParam = godownId
            ? `&Godown_Id=${encodeURIComponent(String(godownId))}`
            : "";
        const url = API.reportApi(
            `reports/externalAPI/salesDeliveryCummulative?Fromdate=${encodeURIComponent(
                fromdate,
            )}&Todate=${encodeURIComponent(
                todate,
            )}&company_id=${encodeURIComponent(
                String(company_id),
            )}${godownParam}`,
        );

        const res = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        const json = await res.json();

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        if (!json.success) {
            throw new Error(
                json.message || "Failed to fetch delivery funnel data",
            );
        }

        return json.data || [];
    } catch (error) {
        console.error("Error fetching delivery funnel:", error);
        throw error;
    }
};

export const fetchDeliveryFunnelDayWise = async (
    fromdate: string,
    todate: string,
    company_id: string | number,
    godownId?: string | number,
) => {
    try {
        const godownParam = godownId
            ? `&Godown_Id=${encodeURIComponent(String(godownId))}`
            : "";
        const url = API.reportApi(
            `reports/externalAPI/salesDeliveryDaywise?Fromdate=${encodeURIComponent(
                fromdate,
            )}&Todate=${encodeURIComponent(
                todate,
            )}&company_id=${encodeURIComponent(
                String(company_id),
            )}${godownParam}`,
        );

        const res = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        const json = await res.json();

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        if (!json.success) {
            throw new Error(
                json.message || "Failed to fetch delivery funnel day-wise data",
            );
        }

        return json.data || [];
    } catch (error) {
        console.error("Error fetching delivery funnel day-wise:", error);
        throw error;
    }
};

// Rate Master 

export const fetchRateMaster = async (
    fromdate: string,
    company_id: string | number,
) => {
    try {
        const url = API.reportApi(
            `masters/posRateMaster?FromDate=${encodeURIComponent(
                fromdate,
            )}&company_id=${encodeURIComponent(String(company_id))}`,
        );

        const res = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        const json = await res.json();

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        if (!json.success) {
            throw new Error(json.message || "Failed to fetch rate master data");
        }

        return json.data?.posRateMaster || [];
    } catch (error) {
        console.error("Error fetching rate master:", error);
        throw error;
    }
};

export const fetchRateMasterStockValue = async (
    fromdate: string,
    company_id: string | number,
) => {
    try {
        const url = API.reportApi(
            `reports/externalAPI/stockValue?FromDate=${encodeURIComponent(
                fromdate,
            )}&company_id=${encodeURIComponent(String(company_id))}`,
        );

        const res = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        const json = await res.json();

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        if (!json.success) {
            throw new Error(json.message || "Failed to fetch rate master data");
        }

        return json.data || [];
    } catch (error) {
        console.error("Error fetching rate master:", error);
        throw error;
    }
};

// Rate Master Admin

export const fetchRateMasterAdmin = async (
    fromdate: string,
    company_id: string | number,
) => {
    try {
        const url = API.reportApi(
            `reports/externalAPI/rateMasterAdmin?Todate=${encodeURIComponent(
                fromdate,
            )}&company_id=${encodeURIComponent(String(company_id))}`,
        );

        const res = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        const json = await res.json();

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        if (!json.success) {
            throw new Error(json.message || "Failed to fetch rate master admin data");
        }

        return json.data || { Data1: [], Data2: [] };
    } catch (error) {
        console.error("Error fetching rate master admin:", error);
        throw error;
    }
};