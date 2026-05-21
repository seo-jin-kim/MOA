import {FaStar} from "react-icons/fa";
import Calendar from "../../components/Calendar.tsx";
import {useState} from "react";
import "../../assets/styles/mypage/myCalendar.css";
import DropdownSelect from "../../components/DropdownSelect.tsx";
import CalendarWriteModal from "./CalendarWriteModal.tsx";
import {useQuery} from "@tanstack/react-query";
import type {CalendarEvent} from "../../types/calendar.ts";
import {getCalendarsApi} from "../../apis/CalendarService.tsx";
import CalendarDetailModal from "./CalendarDetailModal.tsx";

const MyCalendar = () => {

    const [viewDate, setViewDate] = useState(new Date());
    const [showShared, setShowShared] = useState(true);
    const [showPersonal, setShowPersonal] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isWriteOpen, setIsWriteOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [selectedCalendarId, setSelectedCalendarId] = useState<number | null>(null);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const years = Array.from({length: 5}, (_, i) => new Date().getFullYear() + 1 - i);
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    const {data: events =[], refetch} = useQuery<CalendarEvent[]>({
        queryKey: ["calendars"],
        queryFn: () => getCalendarsApi()
    })
    console.log(events);

    const categoryStyles: Record<string, {bg: string, dot: string}> = {

        "행사":     { bg: "#fbe5e5", dot: "#d64b4b" },
        "회의":     { bg: "#fdfbd2", dot: "#F9A825" },
        "주말 근무": { bg: "#e0e2f3", dot: "#111DA3" },
        "연차":     { bg: "#e9e4fa", dot: "#6d3ccd" },
        "회식":     { bg: "#e3f4ff", dot: "#0a3368" },
        "개인":     { bg: "#fde8d9", dot: "#ea591c" },
    };

    const filteredEvents = events
        .filter(e => {
            if (e.type === "개인") return showPersonal;
            if (e.type === "공유") return showShared;
            return false;
        })
        .map(e => ({
            ...e,
            color:    categoryStyles[e.calendarCategoryName ?? ""]?.bg  ?? "#f1f1f1",
            dotColor: categoryStyles[e.calendarCategoryName ?? ""]?.dot ?? "#aaa"
        }));


    return(
        <>
            <div className="favorite-Header">
                <FaStar size={18} color="#C4C4C4"/>
                <span>일정관리</span>
            </div>
            <div>
                <div className="myCalendar-Wrapper">
                    <div className="myCalendar-Side">
                        <div className="myCalendar-Year">
                            <DropdownSelect
                                value={year}
                                options={years}
                                onChange={(y) => setViewDate(new Date(y, month, 1))}
                                allowInput={true}
                            />
                        </div>
                            <div className="myCalendar-Months">
                                {months.map(m => (
                                    <button
                                        key={m}
                                        className={`month-Btn ${month +1 === m ? "active":""}`}
                                        onClick={()=>setViewDate(new Date(year,m-1,1 ))}
                                    >
                                        {m}월
                                    </button>
                                ))}
                            </div>
                            <div className= "myCalendar-Filter">
                                <p className="filter-Title">내 캘린더</p>
                                <label className="filter-Item">
                                    <input
                                        type="checkbox"
                                        checked={showShared}
                                        onChange={(e)=>setShowShared(e.target.checked)}
                                    />
                                    [기본] 공유일정캘린더
                                </label>
                                <label className="filter-Item">
                                    <input
                                        type="checkbox"
                                        checked={showPersonal}
                                        onChange={(e)=>setShowPersonal(e.target.checked)}
                                    />
                                    개인일정캘린더
                                </label>
                            </div>
                        </div>
                    <div className="myCalendar-Main">
                        <Calendar
                            showHeader={false}
                            viewDate={viewDate}
                            events ={filteredEvents}
                            onEventClick={(id) => {
                                setSelectedCalendarId(id);
                                setIsDetailOpen(true);
                            }}
                        />
                        <button
                            onClick={() => {
                                setEditId(null);
                                setIsWriteOpen(true);
                            }}
                            className="addBtn btn-Primary"
                        >
                            신규
                        </button>
                    </div>
                </div>
            </div>
            <CalendarDetailModal
                calendarId={selectedCalendarId}
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                onSuccess={() => refetch()}
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
                onSuccess={() => refetch()}
            />
        </>
    )
}
export default MyCalendar;