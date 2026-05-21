import { useQuery , useMutation } from "@tanstack/react-query";
import axios from "axios";

// const Api_BASE = "http://localhost/api/admin/levels";
// const Api_role = "http://localhost/api/select/role";

const Api_BASE = "/api/admin/levels";
const Api_role = "/api/select/role";

//아마존용
// const Api_BASE = "http://3.34.125.146/api/admin/levels";
// const Api_role = "http://3.34.125.146/api/select/role";

 // 조회 및 검색
  export function useGetRole( search?: string , page? : number  ,  size? : number ) {
    return useQuery({
      queryKey: ["admin", search || '' , page , size ], 
      queryFn: async () => {
        const { data } = await axios.get(`${Api_BASE}`, {   
          params: {
             page : page ,
             size : size ,
            search : search || ''
          }
        });
        return data;
      },
    });
  }

  export function usePatchRole () {
  return useMutation({
      mutationFn: async ({ userId , roleId }: { userId: number , roleId : number}) => {
        const response = await axios.patch(
          Api_BASE + `/${userId}`, null , {
            params : {
              roleId: roleId 
            } , withCredentials: true
          }
        );
        return response.data;
      },
      onSuccess: (data) => {
        console.log("수정 성공!" + data );
      },
      onError: (error: any) => {

        console.error("수정 실패:", error.response?.data || error.message);
      }
    });

  }

  // 문서종류 선택 
  export function useGetRoleSelect( roleCord?: string ) {
      return useQuery({
        queryKey: ["roleCord", roleCord ], 
        queryFn: async () => {
          const { data } = await axios.get(Api_role, {   
            params: {
              roleCord : roleCord 
            }
          });
          return data;
        },
      });
  }