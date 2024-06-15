const endPoint = "https://erpsmt.in/user/";

export const api = {
    getUserAuth: endPoint + "api/getUserByAuth?Auth=",
    login: endPoint + "api/login",

    attendance: endPoint + "api/attendance",
    getLastAttendance: endPoint + "api/getMyLastAttendance?UserId=",
}