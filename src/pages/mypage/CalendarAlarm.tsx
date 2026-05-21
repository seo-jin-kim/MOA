import {useEffect, useRef, useState} from "react";
import {getCalendarsApi} from "../../apis/CalendarService.tsx";
import {MdCalendarMonth, MdClose} from "react-icons/md";
import {useAuthStore} from "../../stores/useAuthStore.tsx";

interface AlarmItem{
    calendarId: number;
    eventTitle: string;
    eventStartDate: string;
}
const POLL_INTERVAL = 1000;
// 5분 마다 갱신으로 변경
// const FIVE_MINUTES = 5 * 60 * 1000;
const ALARM_BEFORE = 10 * 60 * 1000;

const CalendarAlarm = () => {

    const {user} = useAuthStore();
    const [alarms, setAlarms] = useState<AlarmItem[]>([]);
    const notifiedIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        if(!user) return;
        const checkAlarms = async () => {
            try {
                const data = await getCalendarsApi();
                const now = new Date().getTime();
                data.filter((e: any) => e.alarm !== 10).forEach((e: any) => {
                    notifiedIds.current.forEach(key => {
                        if (key.startsWith(`${e.calendarId}_`)) {
                            notifiedIds.current.delete(key);
                        }
                    });
                });
                //삭제된 일정 알림 제거
                const activeAlarmIds = data
                    .filter((e: any) => e.alarm === 10)
                    .map((e: any) => e.calendarId);

                setAlarms(prev => prev.filter(a => activeAlarmIds.includes(a.calendarId)));


                const upcoming = data.filter((event: any) => {
                    if (event.alarm !== 10) return false;
                    const key = `${event.calendarId}_${event.eventStartDate}_${event.alarm}`;
                    const startTime = new Date(event.eventStartDate.replace(" ", "T")).getTime();
                    const diff = startTime - now;
                    if (notifiedIds.current.has(key)) return false;
                    return diff >= 0 && diff <= ALARM_BEFORE;
                });
                if (upcoming.length > 0) {
                    upcoming.forEach((e: any) => notifiedIds.current.add(`${e.calendarId}_${e.eventStartDate}_${e.alarm}`));
                    setAlarms(prev => [...prev, ...upcoming]);
                }

            } catch {
                console.error("알림 조회 실패");
            }
        }
        void checkAlarms();

        const timer = setInterval(checkAlarms, POLL_INTERVAL);
        return () => clearInterval(timer);
        },[user]);

    const dismissAlarm = (calendarId: number) => {
        setAlarms(prev => prev.filter(a=>a.calendarId !== calendarId))
    }

    if(alarms.length == 0) return null;

    return (
        <div style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            zIndex: 9999,
        }}>
            {alarms.map((alarm) => (
                <div key={alarm.calendarId} style={{
                    background: "var(--color-inverse)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    padding: "20px 16px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    minWidth: "280px",
                }}>
                    <MdCalendarMonth size={20} color="var(--color-primary)"/>

                    <div style={{flex: 1}}>
                        <p style={{fontSize: "var(--font-sm)", fontWeight: 500, color: "var(--text-primary)"}}>
                            일정 알림
                        </p>
                        <p style={{fontSize: "var(--font-xs)", color: "var(--text-secondary)", marginTop: "4px"}}>
                            {alarm.eventTitle} ({alarm.eventStartDate.slice(11, 16)})
                        </p>
                    </div>

                    <MdClose
                        size={16}
                        color="var(--text-secondary)"
                        style={{position:"absolute",top:"10px", right:"12px", cursor:"pointer"}}
                        onClick={() => dismissAlarm(alarm.calendarId)}
                    />
                </div>
            ))}
        </div>
    )
};
export default CalendarAlarm;