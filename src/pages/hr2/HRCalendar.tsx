import { getHr2Data } from "../../apis/hr2/Hr2Service.tsx";
import Calendar from "../../components/Calendar.tsx";
import { useEffect, useState } from "react";
import { hr2Configs } from "../../types/hr2Configs.tsx";
import type { CalendarEvent } from "../../types/calendar.ts";
import Modal from "../../components/Modal.tsx";

const toCalendarEvents = (data: any[]) => {
    return data.map(item => ({
        calendarId: item.workId,
        eventStartDate: item.workDate,
        eventEndDate: item.workDate,
        calendarCategoryName: item.userName,
        color: "#4CAF50",
        dotColor: "#4CAF50",
    }));
};

const HRCalendar = () => {

    const [events, setEvents] = useState<CalendarEvent[]>([]);

    // 날짜 선택
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // 리스트 모달
    const [listOpen, setListOpen] = useState(false);
    const [listData, setListData] = useState<any[]>([]);

    // 상세 모달
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                // 현재 날짜를 yyyy-MM 형식으로 포맷팅 (예: 2026-05)
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const selectMonth = `${year}-${month}`;

                const data = await getHr2Data(
                    "calendar",
                    0,
                    100,
                    { selectMonth }
                );

                setEvents(toCalendarEvents(data) as any);
            } catch (error) {
                console.error("캘린더 데이터 로드 실패:", error);
            }
        };

        load();
    }, []);
    // 캘린더 클릭 → 날짜 기준 리스트
    const handleDateClick = async (id: number) => {
        setSelectedDate(String(id));
        setListOpen(true);

        // 날짜 기준 리스트 API
        const data = await getHr2Data(
            (hr2Configs as any).calendar.apiUrl,
            0,
            100,
            { workDate: id }
        );

        setListData(data.content ?? data);
    };

    // 리스트 클릭 → 상세 모달
    const handleRowClick = (id: number) => {
        setSelectedId(id);
        setDetailOpen(true);
    };

    return (
        <div>

            {/* 캘린더 */}
            <Calendar
                events={events}
                onEventClick={handleDateClick}
            />

            {/* 리스트 모달 */}
            <Modal
                title={`출근 리스트 (${selectedDate})`}
                isOpen={listOpen}
                onClose={() => setListOpen(false)}
            >
                <div>
                    {listData.map((item) => (
                        <div
                            key={item.workId}
                            onClick={() => handleRowClick(item.workId)}
                        >
                            {item.userName}
                        </div>
                    ))}
                </div>
            </Modal>

            <Modal
                title="상세"
                isOpen={detailOpen}
                onClose={() => setDetailOpen(false)}
            >
                <div>
                    {selectedId}   출/퇴근기록부
                </div>
            </Modal>

        </div>
    );
};

export default HRCalendar;