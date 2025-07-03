import { API } from "../constants/api";

export const itemWiseStock = async (from: Date | string, to: Date | string) => {
    try {
        const fromStr =
            typeof from === "string" ? from : from.toISOString().split("T")[0];
        const toStr =
            typeof to === "string" ? to : to.toISOString().split("T")[0];

        const url = API.itemWiseStock(fromStr, toStr);
        // console.log("Fetching item-wise stock data:", { fromStr, toStr, url });

        const res = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const json = await res.json();
        console.log("Item-wise stock API response:", json);

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        if (!json.success) {
            throw new Error(
                json.message || "Failed to fetch item-wise stock data",
            );
        }

        return json.data || [];
    } catch (error) {
        console.error("Error fetching item-wise stock data:", error);
        throw error;
    }
};

export const godownWiseStock = async (
    from: Date | string,
    to: Date | string,
) => {
    try {
        const fromStr =
            typeof from === "string" ? from : from.toISOString().split("T")[0];
        const toStr =
            typeof to === "string" ? to : to.toISOString().split("T")[0];

        const url = API.godownWiseStock(fromStr, toStr);
        console.log("Fetching godown-wise stock data:", {
            fromStr,
            toStr,
            url,
        });

        const res = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const json = await res.json();
        console.log("Godown-wise stock API response:", json);

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        if (!json.success) {
            throw new Error(
                json.message || "Failed to fetch godown-wise stock data",
            );
        }

        return json.data || [];
    } catch (error) {
        console.error("Error fetching godown-wise stock data:", error);
        throw error;
    }
};
