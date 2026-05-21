import { useQuery , useMutation } from "@tanstack/react-query";
import axios from "axios";

//  const Api_BASE = "http://localhost/api/inventory/";
const Api_BASE = "/api/inventory/";

//아마존용
// const Api_BASE = "http://3.34.125.146/api/inventory/";

  // 조회 및 검색
  export function useGetInventory( search?: string , page? : number  ,  size? : number ) {
    return useQuery({
      queryKey: ["admin", search || '' , page , size ], 
      queryFn: async () => {
        const { data } = await axios.get(`${Api_BASE}status`, {   
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

  // 상세 조회
  export function useGetInventoryInfo () {
    return useMutation({
      mutationFn: async (info: number) => {
        const { data } = await axios.get(`${Api_BASE}status/${info}`, {   
          params: {
            //  info : info ,
          }
        });
        return data;
      },
    });
  }

  // 불량페기조회
  export function useGetDefect( search?: string , page? : number  ,  size? : number ) {
    return useQuery({
      queryKey: ["defect", search || '' , page , size ], 
      queryFn: async () => {
        const { data } = await axios.get(`${Api_BASE}disposals`, {   
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

  // 불량폐기 상세조회
    export function useGetDefectInfo () {
    return useMutation({
      mutationFn: async (info: number) => {
        const { data } = await axios.get(`${Api_BASE}disposals/${info}`, {   
        });
        return data;
      },
    });
  }

  // 발주현황
  export function useGetOrder( search?: string , page? : number  ,  size? : number ) {
    return useQuery({
      queryKey: ["order", search || '' , page , size ], 
      queryFn: async () => {
        const { data } = await axios.get(`${Api_BASE}orders`, {   
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

  // 발주현황 상세조회
  export function useGetOrderInfo () {
    return useMutation({
      mutationFn: async (info: number) => {
        const { data } = await axios.get(`${Api_BASE}orders/${info}`, {   
        });
        return data;
      },
    });
  }

  // 발주수정 
  export function usePutOrderSno () {
    return useMutation({
      mutationFn: async ({ orderFormId, items }: { orderFormId: number, items: any[] }) => {
        const { data } = await axios.put(`${Api_BASE}orders/${orderFormId}`,  
          items 
        );
        return data;
      },
    });
  }

  // 선택용 물품 리스트
  export function useGetProductSelect( ProductCord?: string ) {
    return useQuery({
      queryKey: ["productCord", ProductCord ], 
      queryFn: async () => {
        const { data } = await axios.get(`${Api_BASE}orders/select/product`, {   
          params: {
            ProductCord : ProductCord 
          }
        });
        return data;
      },
    });
  }

  // 선택용 거래처 리스트
  export function useGetVendorSelect( VendorCord?: string ) {
    return useQuery({
      queryKey: ["VendorCord", VendorCord ], 
      queryFn: async () => {
        const { data } = await axios.get(`${Api_BASE}orders/select/vendor`, {   
          params: {
            VendorCord : VendorCord 
          }
        });
        return data;
      },
    });
  }

   // 선택용 창고 리스트
  export function useGetStorageSelect( StorageCord?: string ) {
    return useQuery({
      queryKey: ["StorageCord", StorageCord ], 
      queryFn: async () => {
        const { data } = await axios.get(`${Api_BASE}orders/select/storage`, {   
          params: {
            StorageCord : StorageCord 
          }
        });
        return data;
      },
    });
  }

  // 선택용 인벤토리 리스트
  export function useGetInventorySelect( search?: string , page? : number  ,  size? : number ) {
    return useQuery({
      queryKey: ["InventoryCord", search || '' , page , size ], 
      queryFn: async () => {
        const { data } = await axios.get(`${Api_BASE}orders/select/inventory`, {   
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

  // 발주 신청
  export function usePostOrder () {
    return useMutation({
      mutationFn: async (payload: { 
      orderformDate: string; 
      vendorId: string | number; 
      stockInDate : null;
      orderStatus : string;
      items: any[]
    }) => {
         const { data } = await axios.post(`${Api_BASE}orders`, payload);
      return data;
      },
    });
  }

  // 발주 폼 삭제
  export function useDeleteOrderForm() {
    return useMutation({
      mutationFn: async (orderformId: number) => {
        const { data } = await axios.delete(`${Api_BASE}orders/${orderformId}`);
        return data;
      },
    });
  }

  // 입고현황
  export function useGetInbounds( search?: string , page? : number  ,  size? : number ) {
    return useQuery({
      queryKey: ["order", search || '' , page , size ], 
      queryFn: async () => {
        const { data } = await axios.get(`${Api_BASE}inbounds`, {   
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

  // 입고현황 상세조회
  export function useGetInboundsInfo () {
    return useMutation({
      mutationFn: async (info: number) => {
        const { data } = await axios.get(`${Api_BASE}inbounds/${info}`, {   
        });
        return data;
      },
    });
  }

  // 출고현황
  export function useGetOutbounds( search?: string , page? : number  ,  size? : number ) {
    return useQuery({
      queryKey: ["order", search || '' , page , size ], 
      queryFn: async () => {
        const { data } = await axios.get(`${Api_BASE}outbounds`, {   
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

  // 출고현황 상세조회
  export function useGetOutboundsInfo () {
    return useMutation({
      mutationFn: async (info: number) => {
        const { data } = await axios.get(`${Api_BASE}outbounds/${info}`, {   
        });
        return data;
      },
    });
  }

  // 입고처리
  export function insertbounds () {
    return useMutation({
     mutationFn: async ({ orderformId, payload }: { 
      orderformId: number; 
      payload: any[]; 
    }) => {
         const { data } = await axios.post(`${Api_BASE}inbounds/${orderformId}`, payload);
      return data;
      },
    });
  }

  // 출고처리
  export function postOutbounds () {
    return useMutation({
     mutationFn: async ({ payload }: { 
      payload: any[]; 
    }) => {
         const { data } = await axios.post(`${Api_BASE}outbounds`, payload);
      return data;
      },
    });
  }



  