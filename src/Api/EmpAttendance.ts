import { API } from "../constants/api";

export const getEmpDeptWiseAttendance = async (
    from: Date | string,
    to: Date | string,
) => {
    const fromStr =
        typeof from === "string" ? from : from.toISOString().split("T")[0];
    const toStr = typeof to === "string" ? to : to.toISOString().split("T")[0];

    const url = API.getEmpDeptWiseAttendance(fromStr, toStr);

    const res = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    const json = await res.json();
    if (!json.success)
        throw new Error(json.message || "Failed to fetch attendance data");
    return json.data;
};
