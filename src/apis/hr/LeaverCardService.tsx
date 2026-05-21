import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// const LEAVER_API_BASE = "http://localhost/api/hr/leavers";
// const HR_CARD_API_BASE = "http://localhost/api/hr/cards";

const LEAVER_API_BASE = "/api/hr/leavers";
const HR_CARD_API_BASE = "/api/hr/cards";

//아마존용
// const LEAVER_API_BASE  = "http://3.34.125.146/api/hr/leavers";
// const HR_CARD_API_BASE  = "http://3.34.125.146/api/hr/cards";

export type LeaverCardRecord = {
    userId: number;
    userName?: string | null;
    employeeId?: string | null;
    password?: string | null;
    roleId?: number | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    startDate?: string | null;
    quitDate?: string | null;
    departmentId?: number | null;
    departmentName?: string | null;
    gradeId?: number | null;
    gradeName?: string | null;
    birth?: string | null;
    performance?: string | null;
    profileUrl?: string | null;
    bank?: string | null;
    accountNum?: string | null;
    accountOwner?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
};

export type LeaverCardUpdateRequest = Partial<LeaverCardRecord> & {
    accountOwner?: string | null;
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const isLeaverCard = (card: LeaverCardRecord) => Boolean(card.quitDate?.trim());

const ensureLeaverCard = (card: LeaverCardRecord | null) => {
    if (!card || !isLeaverCard(card)) {
        throw new Error("퇴사자 카드 정보를 찾을 수 없습니다.");
    }

    return card;
};

const normalizeCardList = (data: unknown) => {
    return Array.isArray(data) ? (data as LeaverCardRecord[]) : [];
};

const toUserEntityPayload = (payload: LeaverCardUpdateRequest) => {
    const userEntityPayload = { ...payload };

    delete userEntityPayload.userId;
    delete userEntityPayload.departmentName;
    delete userEntityPayload.gradeName;
    delete userEntityPayload.accountOwner;
    delete userEntityPayload.createdAt;
    delete userEntityPayload.updatedAt;

    return userEntityPayload;
};

const getHrCardInfoApi = async (userId: number) => {
    const { data } = await axios.get(`${HR_CARD_API_BASE}/${userId}`, {
        withCredentials: true,
    });

    if (!isObjectRecord(data) || !("userId" in data)) {
        return null;
    }

    return data as LeaverCardRecord;
};

const getLeaverCardInfoApi = async (userId: number) => {
    const { data } = await axios.get(`${LEAVER_API_BASE}/${userId}`, {
        withCredentials: true,
    });

    if (!isObjectRecord(data) || !("userId" in data)) {
        return null;
    }

    return data as LeaverCardRecord;
};

const getLeaverCardListApi = async () => {
    const { data } = await axios.get(LEAVER_API_BASE, {
        withCredentials: true,
    });

    return normalizeCardList(data).filter(isLeaverCard);
};

const updateLeaverCardApi = async (
    userId: number,
    payload: LeaverCardUpdateRequest
) => {
    await axios.put(`${LEAVER_API_BASE}/${userId}`, toUserEntityPayload(payload), {
        withCredentials: true,
    });

    const updatedCard = await getLeaverCardInfoApi(userId);
    return ensureLeaverCard(updatedCard);
};

const restoreLeaverCardApi = async (userId: number) => {
    const { data } = await axios.put(
        `${LEAVER_API_BASE}/${userId}/restore`,
        {},
        {
            withCredentials: true,
        }
    );

    return data;
};

const deleteLeaverCardApi = async (userId: number) => {
    const { data } = await axios.delete(`${LEAVER_API_BASE}/${userId}`, {
        withCredentials: true,
    });

    return data;
};

// 퇴사자 목록 조회
export function useGetLeaverCardList(search?: string, page?: number, size?: number) {
    return useQuery({
        queryKey: ["leaverCardList", search || "", page, size],
        queryFn: getLeaverCardListApi,
    });
}

// 퇴사자 상세 조회
export function useGetLeaverCardInfo() {
    return useMutation({
        mutationFn: async (userId: number) => {
            const card = await getLeaverCardInfoApi(userId);
            return ensureLeaverCard(card);
        },
    });
}

// 퇴사 처리 등록
export function usePostLeaverCard() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: { userId: number; quitDate: string }) => {
            const userId = payload.userId;
            const quitDate = payload.quitDate?.trim();

            if (!userId) {
                throw new Error("퇴사 처리할 직원을 선택해 주세요.");
            }

            if (!quitDate) {
                throw new Error("퇴사일을 입력해 주세요.");
            }

            const currentCard = await getHrCardInfoApi(userId);

            if (!currentCard) {
                throw new Error("기존 직원 정보를 찾을 수 없습니다.");
            }

            await updateLeaverCardApi(userId, {
                ...currentCard,
                quitDate,
            });

            const updatedCard = await getLeaverCardInfoApi(userId);
            return ensureLeaverCard(updatedCard);
        },
        onSuccess: async (_, variables) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["hrCardList"] }),
                queryClient.invalidateQueries({ queryKey: ["leaverCardList"] }),
                queryClient.invalidateQueries({
                    queryKey: ["leaverCardInfo", variables.userId],
                }),
            ]);
        },
    });
}

// 퇴사자 정보 수정
export function usePutLeaverCard() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
                               userId,
                               payload,
                           }: {
            userId: number;
            payload: LeaverCardUpdateRequest;
        }) => {
            return updateLeaverCardApi(userId, payload);
        },
        onSuccess: async (_, variables) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["hrCardList"] }),
                queryClient.invalidateQueries({ queryKey: ["leaverCardList"] }),
                queryClient.invalidateQueries({
                    queryKey: ["leaverCardInfo", variables.userId],
                }),
            ]);
        },
    });
}

// 퇴사자 삭제
export function useDeleteLeaverCard() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: number) => {
            return deleteLeaverCardApi(userId);
        },
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["hrCardList"] }),
                queryClient.invalidateQueries({ queryKey: ["leaverCardList"] }),
            ]);
        },
    });
}

export function useRestoreLeaverCard() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: number) => {
            return restoreLeaverCardApi(userId);
        },
        onSuccess: async (_, userId) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["hrCardList"] }),
                queryClient.invalidateQueries({ queryKey: ["leaverCardList"] }),
                queryClient.invalidateQueries({ queryKey: ["leaverCardInfo", userId] }),
            ]);
        },
    });
}

export function useLeaverCardList(search?: string, page?: number, size?: number) {
    return useGetLeaverCardList(search, page, size);
}

export function useLeaverCardInfo(userId: number) {
    return useQuery({
        queryKey: ["leaverCardInfo", userId],
        enabled: Boolean(userId),
        queryFn: async () => {
            const card = await getLeaverCardInfoApi(userId);
            return ensureLeaverCard(card);
        },
    });
}

export function useLeaverCardAdd() {
    return usePostLeaverCard();
}

export function useLeaverCardUpdate() {
    const mutation = usePutLeaverCard();

    return {
        ...mutation,
        mutate: (
            variables: { userId: number; request: LeaverCardUpdateRequest },
            options?: Parameters<typeof mutation.mutate>[1]
        ) =>
            mutation.mutate(
                { userId: variables.userId, payload: variables.request },
                options
            ),
        mutateAsync: (variables: {
            userId: number;
            request: LeaverCardUpdateRequest;
        }) =>
            mutation.mutateAsync({
                userId: variables.userId,
                payload: variables.request,
            }),
    };
}

export function useLeaverCardDelete() {
    return useDeleteLeaverCard();
}

export function useLeaverCardRestore() {
    return useRestoreLeaverCard();
}
