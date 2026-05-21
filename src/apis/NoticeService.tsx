import axios from "axios";

//  const API = "http://localhost/api";
const API = "/api";

//아마존용
// const API = "http://3.34.125.146/api";

export async function getNoticesApi(){
    const {data} = await axios.get(
        `${API}/main/notices`,
        { withCredentials: true}
    );
    return data;
}

export async function getNoticeInfoApi(noticeId:number){
    const {data} = await axios.get(
        `${API}/main/notices/${noticeId}`,
        {withCredentials: true}
    );
    return data;
}
export async function createNoticeApi(formData: FormData){
    const { data } = await axios.post(
        `${API}/main/notices`,
        formData,
        {
            withCredentials: true,
            headers: {
                "Content-Type": "multipart/form-data"
            }
        }
    );
    return data;
}
export async function updateNoticeApi(noticeId: number, formData: FormData){
    const { data } = await axios.put(
        `${API}/main/notices/${noticeId}`,
        formData,
        {
            withCredentials: true,
            headers: {
                "Content-Type": "multipart/form-data"
            }
        }
    );
    return data;

}
export async function deleteNoticeApi(noticeId:number){
    const { data } = await axios.delete(
        `${API}/main/notices/${noticeId}`,
        { withCredentials: true}
    );
    return data;
}