import axios from "axios";

//  const API = "http://localhost/api";

const API = "/api";

//아마존용
// const API = "http://3.34.125.146/api";

// 캘린더 목록 조회
export async function getCalendarsApi(type?: string) {
    const {data} = await axios.get(
        `${API}/my/calendars`,
        {params: {type},
        withCredentials: true}
    );
    return data;
}

// 캘린더 상세조회
export async function getCalendarApi(calendarId: number) {
    const {data} = await axios.get(
        `${API}/my/calendars/${calendarId}`,
        {withCredentials: true}
    );
    return data;
}

// 일정구분 조회
export async function getCategoriesApi() {
    const {data} = await axios.get(
        `${API}/my/calendars/category`,
        {withCredentials: true}
    );
    return data;
}

//공유자 조회(모달창에서)
export async function getMembersApi() {
    const {data} = await axios.get(`${API}/my/calendars/members`,
        {withCredentials: true}
    );
    return data;
}

//캘린더 등록
export async function saveCalendarApi(formData: FormData) {
    const {data} = await axios.post(
        `${API}/my/calendars`, formData,
        {withCredentials: true}
    );
    return data;
}

// 캘린더 수정
export async function updateCalendarApi(calendarId: number, formData: FormData) {
    const {data} = await axios.put(
        `${API}/my/calendars/${calendarId}`, formData,
        {withCredentials: true}
    );
    return data;
}

// 캘린더 삭제
export async function deleteCalendarApi(calendarId: number) {
    const {data} = await axios.delete(
        `${API}/my/calendars/${calendarId}`,
        {withCredentials: true}
    );
    return data;
}