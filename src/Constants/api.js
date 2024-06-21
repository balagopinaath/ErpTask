const endPoint = "https://erpsmt.in/user/";
// const endPoint = "http://192.168.1.3:7001/user/";

export const api = {
    getUserAuth: endPoint + "api/getUserByAuth?Auth=",
    login: endPoint + "api/login",

    attendance: endPoint + "api/attendance",
    getLastAttendance: endPoint + "api/getMyLastAttendance?UserId=",

    getDrivers: endPoint + "api/driverActivities/drivers",
    getDriverActivities: (reqDate, reqLocation) => `${endPoint}api/driverActivities?reqDate=${reqDate}&reqLocation=${reqLocation}`,

    getGodownActivities: (fromDate, toDate, reqLocation) => `${endPoint}api/godownActivities?Fromdate=${fromDate}&Todate=${toDate}&LocationDetails=${reqLocation}`
}