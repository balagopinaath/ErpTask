const endPoint = "https://erpsmt.in/api/";
const localEndPoint = "http://192.168.1.3:7001/user/";

export const api = {
    getUserAuth: endPoint + "authorization/userAuth=",
    login: endPoint + "authorization/login",

    attendance: endPoint + "empAttendance/attendance",
    getLastAttendance: endPoint + "empAttendance/attendance?UserId=",

    getDrivers: endPoint + "/driverActivities/drivers",
    getDriverActivities: (reqDate, reqLocation) => `${endPoint}dataEntry/driverActivities??reqDate=${reqDate}&reqLocation=${reqLocation}`,
    getDriverTripBasedActivities: (fromDate, reqLocation) => `${endPoint}dataEntry/driverActivities/tripBased?reqDate=${fromDate}&reqLocation=${reqLocation}`,
    getTimeBasedDriverActivities: (fromDate, reqLocation) => `${endPoint}dataEntry/driverActivities/timeBased?reqDate=${fromDate}&reqLocation=${reqLocation}`,
    getListBasedDriverActivities: (fromDate, reqLocation) => `${endPoint}dataEntry/driverActivities/view2?reqDate=${fromDate}&reqLocation=${reqLocation}`,

    getGodownActivities: (fromDate, toDate, reqLocation) => `${endPoint}dataEntry/godownActivities?Fromdate=${fromDate}&Todate=${toDate}&LocationDetails=${reqLocation}`,
    getGodownActivitiesAbstract: (fromDate, reqLocation) => `${endPoint}dataEntry/godownActivities/abstract?reqDate=${fromDate}&reqLocation=${reqLocation}`,

    getDeliveryActivities: (fromDate, reqLocation) => `${endPoint}dataEntry/deliveryActivities?reqDate=${fromDate}&reqLocation=${reqLocation}`,
    getDeliveryActivitiesAbstract: (fromDate, reqLocation) => `${endPoint}dataEntry/deliveryActivities/abstract?reqDate=${fromDate}&reqLocation=${reqLocation}`,

    getStaffActivities: (fromDate, reqLocation) => `${endPoint}dataEntry/staffActivities?reqDate=${fromDate}&reqLocation=${reqLocation}`,
    getStaffActivitiesAbstract: (fromDate, reqLocation) => `${endPoint}dataEntry/staffActivities/staffBased?reqDate=${fromDate}&reqLocation=${reqLocation}`,

    getweightCheckActivity: (reqDate, reqLocation) => `${endPoint}dataEntry/weightCheckActivity?reqDate=${reqDate}&reqLocation=${reqLocation}`,

    getStaffAttendance: (fromDate, toDate, reqLocation) => `${endPoint}dataEntry/dataEntryAttendance?Fromdate=${fromDate}&Todate=${toDate}&reqLocation=${reqLocation}`,

    inwardActivity: endPoint + "dataEntry/inwardActivity",
    machineOutern: endPoint + "dataEntry/machineOutern",
}