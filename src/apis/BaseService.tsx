import axios from "axios";
import {baseConfigs} from "../types/baseConfigs.tsx";

    const api = axios.create({
        //  baseURL: "http://localhost/",
        baseURL: "/",
        //아마존용
        // baseURL : "http://3.34.125.146/",
        withCredentials: true
    });
// GET 요청용 (조회)
    export const getBaseData = async (path: keyof typeof baseConfigs, page = 0, size = 15) => {
        const realUrl = baseConfigs[path].apiUrl;

        const { data } = await api.get(`${realUrl}?page=${page}&size=${size}`); // path에는 "whse"나 "allow"만 들어옴
        console.log("서버에서 온 원본 데이터:", data);
        return data;
    };

// POST 요청용 (등록)
    export const saveBaseData = async (path: keyof typeof baseConfigs, payload: any) => {
        const realUrl = baseConfigs[path].apiUrl;

        const { data } = await api.post(realUrl, payload);
        return data;
    };
// 수정 (PUT)
    export const updateBaseData = async (path: keyof typeof baseConfigs, id: number | string, payload: any) => {
        const realUrl = baseConfigs[path].apiUrl;

        const { data } = await api.put(`${realUrl}/${id}`, payload);
        return data;
    };

// 삭제 (DELETE)
    export const deleteBaseData = async (path: keyof typeof baseConfigs, id: number | string) => {
        const realUrl = baseConfigs[path].apiUrl;

        const { data } = await api.delete(`${realUrl}/${id}`);
        return data;
    };
