import axios from "axios";
import type {Transaction, VendorMonthly} from "../types/transaction.ts";

//  const API = "http://localhost/api";
const API = "/api";

//아마존용
// const API = "http://3.34.125.146/api";

//전체조회
export const getTransactionsApi = async () => {
    const {data} = await axios.get(
        `${API}/sales/journals`,
        {
            withCredentials:true
        });
    return data;
};

//상세조회
export const getTransactionApi = async (transactionId: number) => {
    const {data} = await axios.get(
        `${API}/sales/journals/${transactionId}`,
        {
        withCredentials: true,
    });
    return data;
};

// 수정
export const updateTransactionApi = async (transactionId: number, request: {
    transactionPrice: number;
    transactionMemo: string;
}) => {
    const {data} = await axios.put(`
    ${API}/sales/journals/${transactionId}`, request,
        {
        withCredentials: true,
    });
    return data;
};

// 삭제
export const deleteTransactionApi = async (transactionId: number) => {
    const {data} = await axios.delete(
        `${API}/sales/journals/${transactionId}`,
        {
        withCredentials: true,
    });
    return data;
};

//전자세금계산서
export const getTaxInvoiceApi = async (transactionId: number) => {
    const {data} = await axios.get(
        `${API}/sales/journals/${transactionId}/tax-invoice`,
        {
        withCredentials: true,
    });
    return data;
};

//전자세금계산서 조회
export const getTaxInvoiceListApi = async (): Promise<Transaction[]> => {
    const {data} = await axios.get(
        `${API}/sales/taxInv`,
        {
        withCredentials: true,
    });
    return data;
};

//월별매입집계
export const getMonthlyExpenseApi = async (): Promise<VendorMonthly[]> => {
    const {data} = await axios.get(
        `${API}/sales/expense`, {
        withCredentials: true,
    });
    return data;
};

//월별매출집계
export const getMonthlyRevenueApi = async (): Promise<VendorMonthly[]> => {
    const {data} = await axios.get(
        `${API}/sales/revenue`, {
        withCredentials: true,
    });
    return data;
};