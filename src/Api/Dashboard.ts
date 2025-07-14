import { API } from "../constants/api";

export const dashBoardDayBook = async (
    from: Date | string,
    to: Date | string,
    companyId?: number,
) => {
    const fromStr =
        typeof from === "string" ? from : from.toISOString().split("T")[0];
    const toStr = typeof to === "string" ? to : to.toISOString().split("T")[0];

    const url = API.dashBoardDayBook(fromStr, toStr);
    // console.log("Day Book URL:", url);
    const res = await fetch(url, {
        method: "GET",
        headers: {
            Db: companyId ? companyId.toString() : "0",
        },
    });

    const json = await res.json();
    if (!json.success) {
        throw new Error(json.message || "Failed to fetch day book data");
    }
    return json.data;
};

export const dashBoardData = async (from: Date | string, companyId: number) => {
    const fromStr =
        typeof from === "string" ? from : from.toISOString().split("T")[0];

    const url = API.dashBoardData(fromStr, companyId);
    // console.log("Dashboard Data URL:", url);
    const res = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    const json = await res.json();
    if (!json.success) {
        throw new Error(json.message || "Failed to fetch dashboard data");
    }

    return json.data;
};
