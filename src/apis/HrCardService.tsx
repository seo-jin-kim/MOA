import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

//  const API = "http://localhost/api/hr/cards";
const API = "/api/hr/cards";

//아마존용
// const API = "http://3.34.125.146/api/hr/cards";

export interface HrCard {
    user_id: number;
    user_name: string;
    employee_id: number;
    phone: string;
    email: string;
    address?: string;
    start_date: string;
    quit_date?: string | null;
    department_id: number;
    grade_id: number;
    birth?: string | null;
    performance?: string;
    bank?: string;
    account_num?: string;
}

export interface HrCardRequest {
    user_name: string;
    employee_id: number;
    phone: string;
    email: string;
    address?: string;
    start_date: string;
    quit_date?: string | null;
    department_id: number;
    grade_id: number;
    birth?: string | null;
    performance?: string;
    bank?: string;
    account_num?: string;
}

export interface HrCardUpdateRequest {
    user_name?: string;
    employee_id?: number;
    phone?: string;
    email?: string;
    address?: string;
    start_date?: string;
    quit_date?: string | null;
    department_id?: number;
    grade_id?: number;
    birth?: string | null;
    performance?: string;
    bank?: string;
    account_num?: string;
}

/* API 함수들 */
export async function getHrCardListApi() {
    const { data } = await axios.get<HrCard[]>(API, {
        withCredentials: true,
    });
    return data;
}

export async function getHrCardInfoApi(userId: number) {
    const { data } = await axios.get<HrCard>(`${API}/${userId}`, {
        withCredentials: true,
    });
    return data;
}

export async function addHrCardApi(request: HrCardRequest) {
    const { data } = await axios.post<HrCard>(API, request, {
        withCredentials: true,
    });
    return data;
}

export async function updateHrCardApi(userId: number, request: HrCardUpdateRequest) {
    const { data } = await axios.put<HrCard>(`${API}/${userId}`, request, {
        withCredentials: true,
    });
    return data;
}

export async function deleteHrCardApi(userId: number) {
    const { data } = await axios.delete(`${API}/${userId}`, {
        withCredentials: true,
    });
    return data;
}

/* react-query 훅들 */
export function useHrCardList() {
    return useQuery<HrCard[]>({
        queryKey: ["hrCardList"],
        queryFn: getHrCardListApi,
    });
}

export function useHrCardInfo(userId: number) {
    return useQuery<HrCard>({
        queryKey: ["hrCardInfo", userId],
        queryFn: () => getHrCardInfoApi(userId),
        enabled: !!userId,
    });
}

export function useHrCardAdd() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: HrCardRequest) => addHrCardApi(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["hrCardList"] });
        },
    });
}

export function useHrCardUpdate() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
                         userId,
                         request,
                     }: {
            userId: number;
            request: HrCardUpdateRequest;
        }) => updateHrCardApi(userId, request),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["hrCardList"] });
            queryClient.invalidateQueries({
                queryKey: ["hrCardInfo", variables.userId],
            });
        },
    });
}

export function useHrCardDelete() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: number) => deleteHrCardApi(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["hrCardList"] });
        },
    });
}