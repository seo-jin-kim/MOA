import {useQuery} from "@tanstack/react-query";
import type {Transaction} from "../../types/transaction.ts";
import {useState} from "react";
import Table, {type TableColumn} from "../../components/Table.tsx";
import {FaStar} from "react-icons/fa";
import {deleteTransactionApi, getTransactionsApi} from "../../apis/SalesService.tsx";
import TransactionModal from "./TransactionModal.tsx";
import ConfirmModal from "../../components/ConfirmModal.tsx";

const SalesJournals = () => {

    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const {data: transactions =[], refetch} = useQuery<Transaction[], Error, Transaction[]>({
        queryKey:["transactions"],
        queryFn:getTransactionsApi,
         select: (data: any) => data.content,
    });

    const columns: TableColumn<Transaction>[] = [
        {
            key: "transactionNum",
            label: "거래코드",
            render: (val, item) => (
                <span
                    onClick={() => {
                        setSelectedId(item.transactionId);
                        setIsDetailOpen(true);
                    }}
                    style={{cursor: "pointer", color: "var(--text-accent)"}}
                >
                    {val}
                </span>
            )
        },
        {key: "transactionType", label: "거래코드명"},
        {key: "vendorCode", label: "거래처코드"},
        {key: "vendorName", label: "거래처명"},
        {key: "transactionId", label: "차변", render: () => "0",align: "right" },
        {key: "transactionPrice", label: "대변", render: (val) => val?.toLocaleString(),align: "right"},
        {key: "transactionMemo", label: "적요"},
    ];

    const handleCheck = (idOrIds: any, checked: boolean, isAll?: boolean) => {
        if (isAll) {
            setSelectedIds(checked ? idOrIds : []);
        } else {
            setSelectedIds(prev =>
                checked ? [...prev, idOrIds] : prev.filter(id => id !== idOrIds)
            );
        }
    };

    const handleDelete = async () => {
        try {
            await Promise.all(selectedIds.map(id => deleteTransactionApi(id)))
            setSelectedIds([]);
            setIsDeleteOpen(false);
            await refetch();
        }catch {
            console.error("삭제실패")
        }
    };
    return(
        <>
            <div className="favorite-Header">
                <FaStar size={18} color="#C4C4C4"/>
                <span>회계거래관리</span>
            </div>
                <Table
                    items={transactions}
                    idKey="transactionId"
                    columns={columns}
                    showCheckbox={true}
                    selectedIds={selectedIds}
                    onCheck={handleCheck}
                />
            {isDetailOpen && selectedId && (
                <TransactionModal
                    isOpen={isDetailOpen}
                    onClose={() => setIsDetailOpen(false)}
                    transactionId={selectedId}
                    onSuccess={() => refetch()}
                />
            )}
                <button
                    className="btn-Primary addBtn"
                    onClick={() => setIsDeleteOpen(true)}
                    disabled={selectedIds.length === 0}
                >
                    삭제
                </button>
            <ConfirmModal
                isOpen={isDeleteOpen}
                message="삭제하시겠습니까?"
                onConfirm={handleDelete}
                onClose={() => setIsDeleteOpen(false)}
            />
        </>
    )
}
export default SalesJournals;