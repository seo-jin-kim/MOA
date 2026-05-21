import { useState} from "react";
import {deleteNoticeApi, getNoticeInfoApi} from "../../../apis/NoticeService.tsx";
import Modal from "../../../components/Modal.tsx";
import {useAuthStore} from "../../../stores/useAuthStore.tsx";
import ConfirmModal from "../../../components/ConfirmModal.tsx";
import {useQuery} from "@tanstack/react-query";
import type {NoticeDetail} from "../../../types/notice.ts";

interface NoticeDetailModalProps {
    noticeId: number | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit: (id: number) => void;
    onSuccess?: () => void;
}

const NoticeDetailModal = ({noticeId, isOpen, onClose, onEdit, onSuccess }:NoticeDetailModalProps) => {

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // const BASE_URL = "http://localhost/api";
    const BASE_URL = "/api";
    const user = useAuthStore(state => state.user);

    const{ data: selectedNotice } = useQuery<NoticeDetail>({
        queryKey: ["notice", noticeId],
        queryFn: () => getNoticeInfoApi(noticeId!),
        enabled: noticeId != null && isOpen
    })
    const handleDelete = async ()=>{
        try {
            await deleteNoticeApi(selectedNotice!.noticeId);
            onSuccess?.();
            setIsDeleteOpen(false);
            onClose()
        }catch{
            console.error("삭제실패")
        }
    }

    return(
        <>
            <Modal
                title="공지사항"
                isOpen={isOpen}
                onClose={onClose}
                footer={
                    <div className="btn-Wrap">
                        {selectedNotice?.writerId === user?.userId && (
                            <>
                                <button className="btn-Primary" onClick={() => onEdit(selectedNotice!.noticeId)}>
                                    수정
                                </button>
                                <button className="btn-Primary" onClick={() => setIsDeleteOpen(true)}>
                                    삭제
                                </button>
                            </>
                        )}
                        <button className="btn-Secondary" onClick={onClose}>
                            취소
                        </button>
                    </div>
                }
            >
                { selectedNotice ? (
                    <>
                        <p style={{fontSize:"17px", color:"#282828",fontWeight:600, marginTop:"12px"}}>{selectedNotice.noticeTitle}</p>
                        <div style={{fontSize:"13px",fontWeight:300,flex:"1",marginTop:"10px",color:"#151515"}}>
                            <p>{selectedNotice.noticeContent}</p>
                        </div>
                        {selectedNotice.file && (
                            <a href={`${BASE_URL}/main/file/${selectedNotice.file}`} target="_blank" style={{fontSize:"13px"}}>
                                <p>{selectedNotice.file}</p>
                            </a>
                        )}
                    </>
                ): (
                    <p>데이터를 불러올 수 없습니다. 관리자에게 문의바랍니다.</p>
                )}
            </Modal>
            <ConfirmModal
                isOpen={isDeleteOpen}
                message="삭제하시겠습니까?"
                onConfirm={handleDelete}
                onClose={()=>setIsDeleteOpen(false)}
            />
        </>
    )
}
export default NoticeDetailModal;