const endPoint = "https://erpsmt.in/user/";
const localEndPoint = "http://192.168.1.3:7001/user/";

export const api = {
    getUserAuth: endPoint + "api/getUserByAuth?Auth=",
    login: endPoint + "api/login",

    attendance: endPoint + "api/attendance",
    getLastAttendance: endPoint + "api/getMyLastAttendance?UserId=",

    getDrivers: endPoint + "api/driverActivities/drivers",
    getDriverActivities: (reqDate, reqLocation) => `${endPoint}api/driverActivities?reqDate=${reqDate}&reqLocation=${reqLocation}`,
    getDriverTripBasedActivities: (fromDate, reqLocation) => `${endPoint}api/driverActivities/tripBased?reqDate=${fromDate}&reqLocation=${reqLocation}`,

    getGodownActivities: (fromDate, toDate, reqLocation) => `${endPoint}api/godownActivities?Fromdate=${fromDate}&Todate=${toDate}&LocationDetails=${reqLocation}`,

    getDeliveryActivities: (fromDate, reqLocation) => `${endPoint}api/deliveryActivities?reqDate=${fromDate}&reqLocation=${reqLocation}`,

    getStaffActivities: (fromDate, reqLocation) => `${endPoint}api/staffActivities?reqDate=${fromDate}&reqLocation=${reqLocation}`,

    getweightCheckActivity: (reqDate, reqLocation) => `${endPoint}api/weightCheckActivity?reqDate=${reqDate}&reqLocation=${reqLocation}`,

    inwardActivity: endPoint + "api/inwardActivity",
    machineOutern: endPoint + "api/machineOutern",
}