import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";

// const API_BASE = "http://localhost/api/hr/cards";
const API_BASE = "/api/hr/cards";

//아마존용
// const API_BASE  = "http://3.34.125.146/api/hr/cards";

export type HrCardRecord = {
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

export type HrCardMutationPayload = {
    userName?: string | null;
    employeeId?: string | null;
    password?: string | null;

    phone?: string | null;
    email?: string | null;
    address?: string | null;

    startDate?: string | null;
    quitDate?: string | null;

    roleId?: number;
    departmentId?: number;
    departmentName?: string | null;

    gradeId?: number;
    gradeName?: string | null;

    birth?: string | null;
    performance?: string | null;
    bank?: string | null;
    accountNum?: string | null;
    accountOwner?: string | null;
};

const toUserEntityPayload = (payload: HrCardMutationPayload) => {
    const userEntityPayload: Record<string, unknown> = { ...payload };

    delete userEntityPayload.departmentName;
    delete userEntityPayload.gradeName;
    delete userEntityPayload.accountOwner;

    return userEntityPayload;
};

// 인사카드 목록 조회
export function useGetHrCardList(search?: string, page?: number, size?: number) {
    return useQuery<HrCardRecord[]>({
        queryKey: ["hrCardList", search || "", page, size],
        queryFn: async () => {
            const { data } = await axios.get<HrCardRecord[]>(API_BASE, {
                params: {
                    page,
                    size,
                    search: search || "",
                },
                withCredentials: true,
            });

            return data;
        },
    });
}

// 인사카드 상세 조회
export function useGetHrCardInfo() {
    return useMutation({
        mutationFn: async (userId: number) => {
            const { data } = await axios.get<HrCardRecord>(
                `${API_BASE}/${userId}`,
                {
                    withCredentials: true,
                }
            );

            return data;
        },
    });
}

// 인사카드 추가
export function usePostHrCard() {
    return useMutation({
        mutationFn: async (payload: HrCardMutationPayload) => {
            const { data } = await axios.post(
                `${API_BASE}/add`,
                toUserEntityPayload(payload),
                {
                    withCredentials: true,
                }
            );

            return data;
        },
    });
}

// 인사카드 수정
export function usePutHrCard() {
    return useMutation({
        mutationFn: async ({
                               userId,
                               payload,
                           }: {
            userId: number;
            payload: HrCardMutationPayload;
        }) => {
            const { data } = await axios.put(
                `${API_BASE}/${userId}`,
                toUserEntityPayload(payload),
                {
                    withCredentials: true,
                }
            );

            return data;
        },
    });
}

// 인사카드 삭제
export function useDeleteHrCard() {
    return useMutation({
        mutationFn: async (userId: number) => {
            const { data } = await axios.delete(`${API_BASE}/${userId}`, {
                withCredentials: true,
            });

            return data;
        },
    });
}