import axios from "axios";
import {hr2Configs} from "../../types/hr2Configs.tsx";


const api = axios.create({
    //  baseURL: "http://localhost/",
    baseURL: "/",
    withCredentials: true,
});

export const getHr2Data = async (path: keyof typeof hr2Configs, page = 0, size = 15, filterDTO: any) => {
    const realUrl = hr2Configs[path].apiUrl;
    console.log("전달된 apiType:", realUrl);
    const { data } = await api.get(`${realUrl}`,{
        params: {
            page,
            size,
            ...filterDTO
    }});
    return data;
};
//
export const saveHr2Data = async (path: keyof typeof hr2Configs, payload: any) => {
    const realUrl = hr2Configs[path].apiUrl;

    const { data } = await api.post(realUrl, payload);
    return data;
};
// 수정 (PUT)
export const updateHr2Data = async (path: keyof typeof hr2Configs, id: number | string, payload: any) => {
    const realUrl = hr2Configs[path].apiUrl;

    const { data } = await api.put(`${realUrl}/${id}`, payload);
    return data;
};

// 삭제 (DELETE)
export const deleteHr2Data = async (path: keyof typeof hr2Configs, id: number | string) => {
    const realUrl = hr2Configs[path].apiUrl;

    const { data } = await api.delete(`${realUrl}/${id}`);
    return data;
};

//출근
export const checkInApi = async () => {
    await api.post(`/api/hr/attendances/checkin`);
};

//퇴근
export const checkOutApi = async () => {
    await api.post("/api/hr/attendances/checkout");
};

//오늘 출퇴근 조회
export const getTodayWorkApi = async () => {
    const {data} = await api.get("/api/hr/attendances/today");
    return data;
};
