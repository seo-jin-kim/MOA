import axios from "axios";

//  const API = "http://localhost/api";
const API = "/api";

//아마존용
// const API = "http://3.34.125.146/api";

export async function getMyInfoApi(){
    const { data } = await axios.get(
        `${API}/my/profile`,
        {withCredentials:true}
    );
    return data;
}