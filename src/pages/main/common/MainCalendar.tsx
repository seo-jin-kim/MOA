import Calendar from "../../../components/Calendar.tsx";
import {BiLinkExternal} from "react-icons/bi";
import {MdRefresh} from "react-icons/md";
import "../../../assets/styles/main/mainPage.css"
import {useQuery} from "@tanstack/react-query";
import type {CalendarEvent} from "../../../types/calendar.ts";
import {getCalendarsApi} from "../../../apis/CalendarService.tsx";
import {useNavigate} from "react-router";
import {useState} from "react";
import CalendarDetailModal from "../../mypage/CalendarDetailModal.tsx";
import CalendarWriteModal from "../../mypage/CalendarWriteModal.tsx";
import {useAuthStore} from "../../../stores/useAuthStore.tsx";

const categoryStyles: Record<string, {bg: string, dot: string}> = {

    "행사":     { bg: "#fbe5e5", dot: "#d64b4b" },
    "회의":     { bg: "#fdfbd2", dot: "#F9A825" },
    "주말 근무": { bg: "#e0e2f3", dot: "#111DA3" },
    "연차":     { bg: "#e9e4fa", dot: "#6d3ccd" },
    "회식":     { bg: "#e3f4ff", dot: "#0a3368" },
    "개인":     { bg: "#fde8d9", dot: "#ea591c" },
};

const MainCalendar = () => {

    const navigate = useNavigate();
    const { setActiveMenu } = useAuthStore();
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isWriteOpen, setIsWriteOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [selectedCalendarId, setSelectedCalendarId] = useState<number | null>(null);

    const {data: events = [], refetch} = useQuery<CalendarEvent[]>({
        queryKey: ["mainCalendars"],
        queryFn: () => getCalendarsApi(),
    });

    const styledEvents = events.map(e => ({
        ...e,
        color:    categoryStyles[e.calendarCategoryName ?? ""]?.bg  ?? "#f1f1f1",
        dotColor: categoryStyles[e.calendarCategoryName ?? ""]?.dot ?? "#aaa",
    }));

    return(
        <div className="calendar-Wrapper">
            <div className="mainCalendar-Header">
                <p>일정관리</p>
                <div className="Header-Icon">
                    <BiLinkExternal
                        size={16}
                        color="#d0d0d0"
                        onClick={() => {
                            setActiveMenu(2);
                            navigate("/my/calendars");
                        }}
                    />
                    <MdRefresh
                        size={19}
                        color="#d0d0d0"
                        onClick={() => void refetch()}
                    />
                </div>
            </div>
            <div className="calendar-Body">
                <Calendar
                    events={styledEvents}
                    categoryStyles={categoryStyles}
                    onEventClick={(id) => {
                        setSelectedCalendarId(id);
                        setIsDetailOpen(true);
                    }}
                />
            </div>
            <CalendarDetailModal
                calendarId={selectedCalendarId}
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                onSuccess={() => void refetch()}
                onEdit={(id) => {
                    setIsDetailOpen(false);
                    setEditId(id);
                    setIsWriteOpen(true);
                }}
            />
            <CalendarWriteModal
                isOpen={isWriteOpen}
                calendarId={editId}
                onClose={() => setIsWriteOpen(false)}
                onSuccess={() => void refetch()}
            />
        </div>
    )
}
export default MainCalendar;