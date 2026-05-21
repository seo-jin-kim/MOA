import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";

// const CERTIFICATES_CARD_API_BASE = "http://localhost/api/hr/certificates";
const CERTIFICATES_CARD_API_BASE = "/api/hr/certificates";

//아마존용
// const CERTIFICATES_CARD_API_BASE  = "http://3.34.125.146/api/hr/certificates";


export type CertificatesCardRecord = {
    userId?: number;
    user_id?: number;

    userName?: string | null;
    user_name?: string | null;

    employeeId?: string | number | null;
    employee_id?: string | number | null;

    password?: string | null;

    phone?: string | null;
    email?: string | null;
    address?: string | null;

    startDate?: string | null;
    start_date?: string | null;

    quitDate?: string | null;
    quit_date?: string | null;

    roleId?: number | null;
    role_id?: number | null;

    departmentId?: number | null;
    department_id?: number | null;
    departmentName?: string | null;
    department_name?: string | null;

    gradeId?: number | null;
    grade_id?: number | null;
    gradeName?: string | null;
    grade_name?: string | null;

    birth?: string | null;
    performance?: string | null;
    bank?: string | null;

    accountNum?: string | null;
    account_num?: string | null;

    accountOwner?: string | null;
    account_owner?: string | null;
};

export type CertificatesCardMutationPayload = {
    employeeId: string | number | null | undefined;
    userName: string | null | undefined;

    roleId?: number | null | undefined;

    departmentId: number | null | undefined;
    departmentName: string | null | undefined;
    departmentCord?: string | null | undefined;

    gradeId: number | null | undefined;
    gradeName: string | null | undefined;
};

const toCertificatesCardPayload = (payload: CertificatesCardMutationPayload) => ({
    // camelCase
    employeeId: payload.employeeId,
    userName: payload.userName,
    roleId: payload. roleId,

    departmentId: payload.departmentId,
    departmentName: payload.departmentName,
    departmentCord: payload.departmentCord,

    gradeId: payload.gradeId,
    gradeName: payload.gradeName,

    // snake_case: 백엔드가 이 이름으로 받을 수도 있어서 같이 보냄
    employee_id: payload.employeeId,
    user_name: payload.userName,
    role_id: payload.roleId,

    department_id: payload.departmentId,
    department_name: payload.departmentName,
    department_cord: payload.departmentCord,

    grade_id: payload.gradeId,
    grade_name: payload.gradeName,
});

export function useGetCertificatesCardList(search?: string, page?: number, size?: number) {
    return useQuery({
        queryKey: ["certificatesCardList", search || "", page, size],
        queryFn: async () => {
            const { data } = await axios.get<CertificatesCardRecord[]>(
                CERTIFICATES_CARD_API_BASE,
                {
                    params: {
                        page,
                        size,
                        search: search || "",
                    },
                    withCredentials: true,
                }
            );

            return data;
        },
    });
}

export function useGetCertificatesCardInfo() {
    return useMutation({
        mutationFn: async (userId: number) => {
            const { data } = await axios.get<CertificatesCardRecord>(
                `${CERTIFICATES_CARD_API_BASE}/${userId}`,
                {
                    withCredentials: true,
                }
            );

            return data;
        },
    });
}

export function usePostCertificatesCard() {
    return useMutation({
        mutationFn: async (payload: CertificatesCardMutationPayload) => {
            const requestPayload = toCertificatesCardPayload(payload);

            console.log("발령 등록 요청:", requestPayload);

            const { data } = await axios.post(
                `${CERTIFICATES_CARD_API_BASE}/add`,
                requestPayload,
                {
                    withCredentials: true,
                }
            );

            return data;
        },
    });
}

export function usePutCertificatesCard() {
    return useMutation({
        mutationFn: async ({
                               userId,
                               payload,
                           }: {
            userId: number;
            payload: CertificatesCardMutationPayload;
        }) => {
            const requestPayload = toCertificatesCardPayload(payload);

            console.log("발령 수정 userId:", userId);
            console.log("발령 수정 요청:", requestPayload);

            const { data } = await axios.put(
                `${CERTIFICATES_CARD_API_BASE}/${userId}`,
                requestPayload,
                {
                    withCredentials: true,
                }
            );

            return data;
        },
    });
}

export function useDeleteCertificatesCard() {
    return useMutation({
        mutationFn: async (userId: number) => {
            const { data } = await axios.delete(
                `${CERTIFICATES_CARD_API_BASE}/${userId}`,
                {
                    withCredentials: true,
                }
            );

            return data;
        },
    });
}

export const useGetHrCardList = useGetCertificatesCardList;
export const useGetHrCardInfo = useGetCertificatesCardInfo;
export const usePostHrCard = usePostCertificatesCard;
export const usePutHrCard = usePutCertificatesCard;
export const useDeleteHrCard = useDeleteCertificatesCard;