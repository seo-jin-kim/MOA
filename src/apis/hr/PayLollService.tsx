import { useQuery, useMutation } from "@tanstack/react-query";
import {hr1Configs} from "../../types/hr1Configs.tsx";
import axios from "axios";

// const API_BASE = "http://localhost/api/hr/payroll";
// const SALARY_API_BASE = "http://localhost/api/hr/salary";

const API_BASE = "/api/hr/payroll";
const SALARY_API_BASE = "/api/hr/salary";

//아마존용
// const API_BASE  = "http://3.34.125.146/api/hr/payroll";
// const SALARY_API_BASE  = "http://3.34.125.146/api/hr/salary";


const api = axios.create({
    // baseURL: "http://localhost/",
    baseURL: "/",
    //아마존
    // baseURL : "http://3.34.125.146/",
    withCredentials: true,
});

const getAxiosErrorMessage = (error: unknown) => {
    if (!axios.isAxiosError(error)) {
        return null;
    }

    const data = error.response?.data;

    if (typeof data === "string" && data.trim() !== "") {
        return data;
    }

    if (typeof data === "object" && data !== null) {
        const responseData = data as Record<string, unknown>;

        for (const key of ["message", "error", "detail", "trace"]) {
            const value = responseData[key];

            if (typeof value === "string" && value.trim() !== "") {
                return value;
            }
        }
    }

    return error.message;
};

export type SalaryRecord = {
    salaryId?: number;
    salary_id?: number;
    userId?: number;
    user_id?: number;
    basePay?: number;
    base_pay?: number;
};

export type PayRollRecord = {

    //거래
    transaction_id: number;
    transactionId: number;

    vendor_id:number;
    vendorId:number;

    orderform_id:number | null;
    orderformId:number | null;

    salary_ledger_id:number | null;
    salaryLedgerId:number | null;

    transaction_num:number;
    transactionNum:number;

    transaction_type:string;
    transactionType:string;

    transaction_price:string;
    transactionPrice:string;

    transaction_memo:string;
    transactionMemo:string;

    //거래처
    vendor_cord:string | null;
    vendorCord:string | null;

    vendor_name:string | null;
    vendorName:string | null;

    vendor_is_use:string | null;
    vendorIsUse:string | null;

    //임금 지불 현황
    user_id?: number;
    userId?: number;

    transfer_id:number;
    transferId:number;

    salary_status:string | null;
    salaryStatus:string | null;

    //기본급
    salary_id:number;
    salaryId:number;

    base_pay:number;
    basePay:number;

    //급여장부
    bank_transfer_id:number;
    bankTransferId:number;

    salary_date:number | null;
    salaryDate:number | null;

    salary_amount:number | null;
    salaryAmount:number | null;

    overtime_allowance?: number | null;
    overtimeAllowance?: number | null;

    weekend_allowance?: number | null;
    weekendAllowance?: number | null;

    annual_allowance?: number | null;
    annualAllowance?: number | null;

    //사용자
    user_name:string | null;
    userName:string | null;
    employee_id:string | null;
    employeeId:string | null;
    department_id:number;
    departmentId:number;
    grade_id:number;
    gradeId:number;
    bank:string | null;
    account_num:string | null;

    //부서
    gradeName:string;

    //직급
    departmentName:string;



    //명칭이 비슷한 컬럼
    transaction_created_at?: string | null;
    transaction_updated_at?: string | null;

    transfe_created_at?: string | null;
    transfe_updated_at?: string | null;

    salary_ledger_created_at?: string | null;
    salary_ledger_updated_at?: string | null;

    salary_created_at?: string | null;
    salary_updated_at?: string | null;
};


export type PayRollMutationPayload = {


    transactionId: number;
    vendorId:number;
    salary_ledgerId:number | null;
    salaryLedgerId?: number | null;
    transactionNum:number;
    transactionType:string;
    transactionPrice:string;
    transaction_price?: string;
    transactionMemo:string;
    transaction_memo?: string;
    vendorCord:string | null;
    vendorName:string | null;
    vendorIsUse:string | null;
    userId?: number;
    transferId:number;
    salaryStatus:string | null;
    salaryId:number;
    basePay:number;
    base_pay?: number;
    bankTransferId:number;
    salaryDate:number | null;
    salary_date?: number | null;
    salaryAmount:number | null;
    salary_amount?: number | null;
    overtimeAllowance?: number | null;
    overtime_allowance?: number | null;
    weekendAllowance?: number | null;
    weekend_allowance?: number | null;
    annualAllowance?: number | null;
    annual_allowance?: number | null;

    userName:string | null;
    employeeId:string | null;
    departmentId:number;
    gradeId:number;
    bank:string | null;
    account_num:string | null;

    //급여 종류
    allowanceId:number;

    allowanceCord:string;

    allowanceName:string;

    
    //부서
    gradeName:string;

    //직급
    departmentName:string;

    transaction_created_at?: string | null;
    transaction_updated_at?: string | null;

    vendor_created_at?: string | null;
    vendor_updated_at?: string | null;

    transfe_created_at?: string | null;
    transfe_updated_at?: string | null;

    salary_ledger_created_at?: string | null;
    salary_ledger_updated_at?: string | null;

    salary_created_at?: string | null;
    salary_updated_at?: string | null;
};

const normalizeArrayResponse = <T,>(data: T[] | { content?: T[] }) => {
    if (Array.isArray(data)) {
        return data;
    }

    return Array.isArray(data?.content) ? data.content : [];
};

export type PayRollDateMutationPayload = {
    transactionId?: number;
    vendorId?: number;
    salaryLedgerId?: number | null;
    transactionNum?: number;
    transactionType?: string;
    transactionPrice?: number;
    transactionMemo?: string;
    createdAt?: string | null;
    created_at?: string | null;
    updatedAt?: string | null;
    updated_at?: string | null;
    clearUpdatedAt?: boolean;
    clear_updated_at?: boolean;
};

export type PayRollCreatePayload = {
    userId: number;
    user_id?: number;
    bankTransferId: number;
    bank_transfer_id?: number;
    salaryDate: string;
    salary_date?: string;
    salaryAmount?: number | null;
    salary_amount?: number | null;
    basePay?: number;
    base_pay?: number;
    transactionMemo?: string;
    transaction_memo?: string;
    transactionType?: string;
    transactionPrice?: string;
    transaction_price?: string;
    salaryStatus?: string;
    salary_status?: string;
    vendorId?: number;
    vendor_id?: number;
    createdAt?: string;
    created_at?: string;
    salary_ledger_created_at?: string;
};

export const getHrData = async (path: keyof typeof hr1Configs) => {
    const realUrl = hr1Configs[path].apiUrl;

    const { data } = await api.get(realUrl);
    return data;
};


const toUserEntityPayload = (payload: PayRollMutationPayload) => {
    const userEntityPayload: Record<string, unknown> = { ...payload };

    delete userEntityPayload.departmentName;
    delete userEntityPayload.gradeName;
    delete userEntityPayload.accountOwner;

    return userEntityPayload;
};

// 급여시즌 목록 조회
export function useGetPayRollList(search?: string, page = 0, size = 1000) {
    return useQuery<PayRollRecord[]>({
        queryKey: ["PayRollList", search || "", page, size],
        queryFn: async () => {
            let data: PayRollRecord[] | { content?: PayRollRecord[] };

            try {
                const response = await axios.get<PayRollRecord[] | { content?: PayRollRecord[] }>(
                    `${API_BASE}/page`,
                    {
                        params: {
                            page,
                            size,
                            search: search || "",
                        },
                        withCredentials: true,
                    }
                );

                data = response.data;
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 500) {
                    return [];
                }

                throw error;
            }

            return normalizeArrayResponse(data);
        },
        retry: false,
    });
}

export function useGetSalaryList() {
    return useQuery<SalaryRecord[]>({
        queryKey: ["salaryList"],
        queryFn: async () => {
            let data: SalaryRecord[] | { content?: SalaryRecord[] };

            try {
                const response = await axios.get<SalaryRecord[] | { content?: SalaryRecord[] }>(
                    SALARY_API_BASE,
                    {
                        withCredentials: true,
                    }
                );

                data = response.data;
            } catch {
                return [];
            }

            return normalizeArrayResponse(data);
        },
        retry: false,
    });
}

// 급여시즌 상세 조회
export function useGetPayRollInfo() {
    return useMutation({
        mutationFn: async (salaryLedgerId: number) => {
            const { data } = await axios.get<PayRollRecord>(
                `${API_BASE}/${salaryLedgerId}`,
                {
                    withCredentials: true,
                }
            );

            return data;
        },
    });
}

// 급여시즌 추가
export function usePostPayRollRecord() {
    return useMutation({
        mutationFn: async (payload: PayRollMutationPayload | PayRollCreatePayload) => {
            let data: unknown;

            try {
                const response = await axios.post(
                    `${API_BASE}/add`,
                    toUserEntityPayload(payload as PayRollMutationPayload),
                    {
                        withCredentials: true,
                    }
                );

                data = response.data;
            } catch (error) {
                const message = getAxiosErrorMessage(error);

                if (message) {
                    throw new Error(message);
                }

                throw error;
            }

            return data;
        },
    });
}

// 급여시즌 수정
export function usePutPayRoll() {
    return useMutation({
        mutationFn: async ({
                               salaryLedgerId,
                               payload,
                           }: {
            salaryLedgerId: number;
            payload: PayRollMutationPayload;
        }) => {
            const { data } = await axios.put(
                `${API_BASE}/${salaryLedgerId}`,
                toUserEntityPayload(payload),
                {
                    withCredentials: true,
                }
            );

            return data;
        },
    });
}

// 급여시즌 삭제
export function useCancelPayRollConfirm() {
    return useMutation({
        mutationFn: async ({
                               transactionId,
                               payload,
                           }: {
            transactionId: number;
            payload: PayRollDateMutationPayload;
        }) => {
            try {
                const { data } = await axios.put(
                    `${API_BASE}/${transactionId}`,
                    payload,
                    {
                        withCredentials: true,
                    }
                );

                return data;
            } catch (error) {
                const message = getAxiosErrorMessage(error);

                if (message) {
                    throw new Error(message);
                }

                throw error;
            }
        },
    });
}

export function useConfirmPayRollCreatedAt() {
    return useMutation({
        mutationFn: async ({
                               transactionId,
                               payload,
                           }: {
            transactionId: number;
            payload: PayRollDateMutationPayload;
        }) => {
            const { data } = await axios.put(
                `${API_BASE}/${transactionId}`,
                payload,
                {
                    withCredentials: true,
                }
            );

            return data;
        },
    });
}

export function useDeletePayRoll() {
    return useMutation({
        mutationFn: async (salaryLedgerId: number) => {
            const { data } = await axios.delete(`${API_BASE}/${salaryLedgerId}`, {
                withCredentials: true,
            });

            return data;
        },
    });
}
