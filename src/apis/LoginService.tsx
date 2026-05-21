import axios from "axios";

//  const API = "http://localhost/api";
const API = "/api";

//아마존용
// const API = "http://3.34.125.146/api";

export async function loginApi(employeeId: string, password: string){
    const { data } = await axios.post(
        `${ API }/auth/login`,
        { employeeId,password },
        { withCredentials: true } //서버와 주소가 달라서 브라우저가 JSESSIONID 쿠키를 같이 보내야 유저 인식(필수)
    );
    return data;
}

export async function logoutApi(){
    const { data } = await axios.post(
        `${ API }/auth/logout`,
        {},
        { withCredentials:true }
    );
    return data;
}

export async function authCheck(){
    const { data } = await axios.get(
        `${ API }/auth/check`,
        { withCredentials:true }
    );
    return data;
}
