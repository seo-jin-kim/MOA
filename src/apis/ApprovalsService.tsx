import { useQuery , useMutation  } from "@tanstack/react-query";
import axios from "axios";

//  const Api_BASE = "http://localhost/api/gw/";
const Api_BASE = "/api/gw/";

//아마존용
// const Api_BASE = "http://3.34.125.146/api/gw";

// 내 결재내역 조회 완료
export function useGetApprovaUserList(  writer : number , search?: string , page? : number  ,  size? : number ) {
    return useQuery({
      queryKey: ["ApprovaUser",  writer ,search || '' , page , size ], 
      queryFn: async () => {
        const { data } = await axios.get(`${Api_BASE}approvals`, {   
          params: {
            writer : writer,
            page : page ,
            size : size ,
            search : search || ''
          }
        });
        return data;
      },
    });
}

// 결재 상제정보 및 팀장 결제 내역 상세조회 완료
export function useGetApprovaInfo () {
    return useMutation({
      mutationFn: async (  approvaId: number ) => {
        const { data } = await axios.get(`${Api_BASE}approvals/${approvaId}`, {   
        });
        return data;
      },
    });
}

// 결재라인 선택 
export function useGetApprovaLineSelect( approvalLineCord?: string ) {
    return useQuery({
      queryKey: ["approvalLineCord", approvalLineCord ], 
      queryFn: async () => {
        const { data } = await axios.get(`${Api_BASE}select/approvaLine`, {   
          params: {
            approvalLineCord : approvalLineCord 
          }
        });
        return data;
      },
    });
}

// 문서종류 선택 
export function useGetDocumentSelect( documentCord?: string ) {
    return useQuery({
      queryKey: ["documentCord", documentCord ], 
      queryFn: async () => {
        const { data } = await axios.get(`${Api_BASE}select/document`, {   
          params: {
            documentCord : documentCord 
          }
        });
        return data;
      },
    });
}

// 결재 요청 post /api/gw/approvals 
export function usePostApprovals () {
    return useMutation({
      mutationFn: async (payload : any ) => {
         const { data } = await axios.post(`${Api_BASE}approvals`, payload);
      return data;
      },
    });
}

// 미결재 결재 삭제 DELETE /api/gw/approvals/{approvaId} 완료
export function useDeleteApprovals() {
    return useMutation({
      mutationFn: async (approvaId: number) => {
        const { data } = await axios.delete(`${Api_BASE}approvals/${approvaId}`);
        return data;
      },
    });
}

// 팀장 결제 내역 조회 GET /api/gw/approvalWait 완료
export function useGetApprovaWaitList(  approvalLineUser : number , search?: string , page? : number  ,  size? : number ) {
    return useQuery({
      queryKey: ["ApprovaUser",  approvalLineUser ,search || '' , page , size ], 
      queryFn: async () => {
        const { data } = await axios.get(`${Api_BASE}approvalWait`, {   
          params: {
            approvalLineUser : approvalLineUser,
            page : page ,
            size : size ,
            search : search || ''
          }
        });
        return data;
      },
    });
}

// 팀장 결제 내역 반려 / 결재 처리 PATCH /api/gw/approvalAct/{approva_id} 완료
export function patchApprovalAct () {
    return useMutation({
     mutationFn: async ({ approvaId, approvaStatus }: { 
      approvaId: number; 
      approvaStatus: string; 
    }) => {
         const { data } = await axios.patch(`${Api_BASE}approvalAct/${approvaId}`, { approvaStatus : approvaStatus });
      return data;
      },
    });
}
 
// 팀원 조회  GET /api/gw/teamMembers 완료
export function useGetMembersList(  departmentId : number , search?: string , page? : number  ,  size? : number ) {
  return useQuery({
    queryKey: ["Members",  departmentId ,search || '' , page , size ], 
    queryFn: async () => {
      const { data } = await axios.get(`${Api_BASE}teamMembers`, {   
        params: {
          departmentId : departmentId,
          page : page ,
          size : size ,
          search : search || ''
        }
      });
      return data;
    },
  });
}

// 팀원 상세 조회  GET /api/gw/teamMembers/{department_id} <= {user_id} 유저로 변경
export function useGetMembersInfo () {
    return useMutation({
      mutationFn: async (  userId: number ) => {
        const { data } = await axios.get(`${Api_BASE}teamMembers/${userId}`, {   
        });
        return data;
      },
    });
}

// 인사 평가 추가 pach /api/gw/teamMembers/{user_id}
export function patchTeamMembers () {
    return useMutation({
     mutationFn: async ({ userId, performance }: { 
      userId: number; 
      performance: string; 
    }) => {
         const { data } = await axios.patch(`${Api_BASE}teamMembers/${userId}`, { performance : performance });
      return data;
      },
    });
}

// 결재 문서 양식 리스트 양식 추가 ,양식 삭제, 양식 수정 <= 윤아님이 만든 기본사항 > 그룹웨어 >  공통양식 리스트로 이동시키기