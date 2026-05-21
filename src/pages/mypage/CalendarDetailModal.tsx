import { useState} from "react";
import {useQuery} from "@tanstack/react-query";
import type {CalendarEvent} from "../../types/calendar.ts";
import {deleteCalendarApi, getCalendarApi} from "../../apis/CalendarService.tsx";
import {type AuthState, useAuthStore} from "../../stores/useAuthStore.tsx";
import Modal from "../../components/Modal.tsx";
import ConfirmModal from "../../components/ConfirmModal.tsx";

interface CalendarDetailModalProps {
    calendarId: number | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit: (id: number) => void;
    onSuccess?: () => void;
}

const CalendarDetailModal = ({calendarId, isOpen, onClose, onEdit, onSuccess }:CalendarDetailModalProps) => {

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const BASE_URL = "/api";
    const user = useAuthStore((state:AuthState) => state.user);

    const{ data: calendar } = useQuery<CalendarEvent>({
        queryKey: ["calendar", calendarId],
        queryFn: () => getCalendarApi(calendarId!),
        enabled: calendarId != null && isOpen
    })
    const handleDelete = async ()=>{
        try {
            await deleteCalendarApi(calendar!.calendarId);
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
                title="일정조회"
                isOpen={isOpen}
                onClose={onClose}
                footer={
                    <div className="btn-Wrap">
                        {calendar?.writer === user?.userId && (
                            <>
                                <button className="btn-Primary" onClick={() => onEdit(calendar!.calendarId)}>
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
                { calendar ? (
                    <div className="Write-Wrapper">
                        <div className="modal-Row">
                            <label>날짜/시간</label>
                            <span className="row-Span">{calendar.eventStartDate} ~ {calendar.eventEndDate}</span>
                        </div>
                        <div className="modal-Row">
                            <label>제목</label>
                            <span className="row-Span">{calendar.eventTitle}</span>
                        </div>
                        <div className="modal-Row">
                            <div className="modal-Row-Group">
                                <div className="modal-Row-Item">
                                    <label>일정구분</label>
                                    <span className="row-Span">{calendar.calendarCategoryName}</span>
                                </div>
                                <div className="modal-Row-Item">
                                    <label>작성자</label>
                                    <span className="row-Span">{calendar.writerName}</span>
                                </div>
                            </div>
                        </div>
                            <div className="modal-Row">
                                <label>첨부</label>
                                {calendar.file ? (
                                    <span className="row-Span">
                                        <a href={`${BASE_URL}/main/file/${calendar.file}`} target="_blank">
                                        {calendar.file.substring(calendar.file.indexOf("_") + 1)}
                                        </a>
                                    </span>
                                ) : (
                                    <span className="row-Span">-</span>
                                )}
                            </div>
                        <hr style={{border: "none", borderTop: "1px solid var(--border)", margin: "17px 0 18px"}}/>
                        {calendar.eventContent && (
                            <>
                                <p style={{fontSize:"17px", color:"#282828",fontWeight:600}}>{calendar.eventTitle}</p>
                                <div style={{fontSize:"13px",fontWeight:300,flex:"1",marginTop:"10px",color:"#151515"}}>
                                    {calendar.eventContent}
                                </div>
                            </>
                        )}
                    </div>
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
export default CalendarDetailModal;