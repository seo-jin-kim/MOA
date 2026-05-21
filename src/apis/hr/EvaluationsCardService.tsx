import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";

// const EVALUATIONS_CARD_API_BASE = "http://localhost/api/hr/evaluations";
const EVALUATIONS_CARD_API_BASE = "/api/hr/evaluations";

//아마존용
// const EVALUATIONS_CARD_API_BASE  = "http://3.34.125.146/api/hr/evaluations";

export type EvaluationsCardRecord = {
    userId?: number;
    user_id?: number;

    userName?: string | null;
    user_name?: string | null;

    employeeId?: string | number | null;
    employee_id?: string | number | null;

    departmentId?: number | null;
    department_id?: number | null;

    departmentName?: string | null;
    department_name?: string | null;

    departmentCord?: string | null;
    department_cord?: string | null;

    gradeId?: number | null;
    grade_id?: number | null;

    gradeName?: string | null;
    grade_name?: string | null;

    email?: string | null;
    phone?: string | null;
    address?: string | null;

    startDate?: string | null;
    start_date?: string | null;

    quitDate?: string | null;
    quit_date?: string | null;

    birth?: string | null;
    performance?: string | null;

    bank?: string | null;
    accountNum?: string | null;
    account_num?: string | null;
};

export type EvaluationsCardMutationPayload = {
    employeeId: string;
    userName: string;
    departmentId: number;
    departmentName: string;
    gradeId: number;
    gradeName: string;
    performance?: string;
};

const toEvaluationsCardPayload = (
    payload: EvaluationsCardMutationPayload
): EvaluationsCardMutationPayload => ({
    userName: payload.userName,
    employeeId: payload.employeeId,
    departmentId: payload.departmentId,
    departmentName: payload.departmentName,
    gradeId: payload.gradeId,
    gradeName: payload.gradeName,
    performance: payload.performance ?? "",
});

export function useGetEvaluationsCardList(search?: string, page?: number, size?: number) {
    return useQuery({
        queryKey: ["paCardList", search || "", page, size],
        queryFn: async () => {
            const { data } = await axios.get<EvaluationsCardRecord[]>(EVALUATIONS_CARD_API_BASE, {
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

export function useGetEvaluationsCardInfo() {
    return useMutation({
        mutationFn: async (userId: number) => {
            const { data } = await axios.get<EvaluationsCardRecord>(
                `${EVALUATIONS_CARD_API_BASE}/${userId}`,
                {
                    withCredentials: true,
                }
            );

            return data;
        },
    });
}

export function usePostEvaluationsCard() {
    return useMutation({
        mutationFn: async (payload: EvaluationsCardMutationPayload) => {
            const { data } = await axios.post(
                `${EVALUATIONS_CARD_API_BASE}/add`,
                toEvaluationsCardPayload(payload),
                {
                    withCredentials: true,
                }
            );

            return data;
        },
    });
}



export function usePutEvaluationsCard() {
    return useMutation({
        mutationFn: async ({
                               userId,
                               payload,
                           }: {
            userId: number;
            payload: EvaluationsCardMutationPayload;
        }) => {
            const { data } = await axios.put(
                `${EVALUATIONS_CARD_API_BASE}/${userId}`,
                {
                    performance: payload.performance ?? "",
                },
                {
                    withCredentials: true,
                }
            );
            return data;
        },
    });
}

export function useDeleteEvaluationsCard() {
    return useMutation({
        mutationFn: async (userId: number) => {
            const { data } = await axios.delete(`${EVALUATIONS_CARD_API_BASE}/${userId}`, {
                withCredentials: true,
            });

            return data;
        },
    });
}

export const useGetHrCardList = useGetEvaluationsCardList;
export const useGetHrCardInfo = useGetEvaluationsCardInfo;
export const usePostHrCard = usePostEvaluationsCard;
export const usePutHrCard = usePutEvaluationsCard;
export const useDeleteHrCard = useDeleteEvaluationsCard;