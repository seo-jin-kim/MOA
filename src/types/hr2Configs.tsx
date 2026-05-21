// 휴가일수 렌더링
const renderVacationDays = (val: any) => {
    // null/undefined 0.00 반환
    if (val === undefined || val === null || val === "") return "0.00";

    // 숫자로 변환
    const num = Number(val);

    // 변환 결과가 숫자가 아니면 0.00, 맞으면 소수점 2자리 고정
    return isNaN(num) ? "0.00" : num.toFixed(2);
};
// 날짜 렌더링
const renderDate = (val: any) => {
    if (!val) return "-";
    // 10자리(yyyy-MM-dd)만 잘라서 출력
    return val.substring(0, 10);
};
//시간 렌더링
const renderTime = (val: any) => {
    if (!val) return "-";
    return val.substring(0, 5); // 앞에서 5글자만 잘라서 '16:50'
};


export const hr2Configs = {
    attendances: {
        hasCrud: true,
        title: "근무기록",
        apiUrl: "/api/hr/attendances",
        idKey: "workId",
        // 필터 조건 필드
        filterFields: [
            { id: "keyword", label: "성명", type: "text", placeholder: "성명" },
            { id: "category", label: "수당항목", type: "text", placeholder: "수당항목"}
        ],
        // 표(Table)에 보여줄 컬럼들
        columns: [
            { key: "workDate", label: "근무일자", render: renderDate, isDate: true },
            { key: "employeeId", label: "사원번호", clickable: true },
            { key: "userName", label: "성명" },
            { key: "allowanceName", label: "수당항목" },
            { key: "workMemo", label: "비고" }
        ],
        // 등록/수정 모달(Modal)에 나타날 입력창들
        fields: [
            { key: "workDate", label: "근무일자", render: renderDate, isDate: true  },
            { key: "employeeId", label: "사원번호", readOnly: true },
            { key: "userName", label: "성명", type:"search",
                //검색모달용
                hasSearch: true,
                searchType: "user",
                mapTo: { userName: "userName", employeeId: "employeeId" },
                readOnly: true
            },
            {
                key: "allowanceCode",
                label: "수당코드",
                type: "text",
                readOnly: true
            },
            { key: "allowanceName", label: "수당항목", type:"search",
                //검색모달용
                hasSearch: true,
                searchType: "allowance",
                mapTo: { allowanceName:"allowanceName", allowanceCord:"allowanceCord" },
                readOnly: true
            },
            { key: "workMemo", label: "비고", type:"text" }
        ]
    },
    Print: {
        hasCrud: false,
        title: "출력물",
        apiUrl: "/api/hr/leavesBalance",
        idKey: "vacationId",
        // 필터 조건 필드
        filterFields: [
            { id: "keyword", label: "부서", type: "text", placeholder: "부서" },
            { id: "category", label: "성명", type: "text", placeholder: "성명" }
        ],
        // 표(Table)에 보여줄 컬럼들
        columns: [
            { key: "departmentName", label: "부서" },
            { key: "employeeId", label: "사원번호", clickable: true },
            { key: "userName", label: "성명" },
            { key: "basicVacation", label: "휴가일수", render: renderVacationDays },
            { key: "useVacation", label: "휴가사용일수", render: renderVacationDays },
            { key: "remainingVacation", label: "휴가잔여일수", render: renderVacationDays }
        ],
        // 등록/수정 모달(Modal)에 나타날 입력창들
        fields: [
            { key: "vacationId", label: "전표번호", type:"text", readOnly: true },
            { key: "basicVacation", label: "휴가일수", type:"number", readOnly: true, render: renderVacationDays },
            { key: "useVacation", label: "휴가사용일수", type:"number", readOnly: true, render: renderVacationDays },
            { key: "remainingVacation", label: "휴가잔여일수", type: "number", readOnly: true, render: renderVacationDays },
        ]
    },
    lateness: {
        hasCrud: false,
        title: "지각현황",
        apiUrl: "/api/hr/latenesses",
        idKey: "workId",
        // 필터 조건 필드
        filterFields: [
            { id: "keyword", label: "부서", type: "text", placeholder: "부서" },
            { id: "category", label: "성명", type: "text", placeholder: "성명" }
        ],
        // 표(Table)에 보여줄 컬럼들
        columns: [
            { key: "workDate", label: "일자", render: renderDate },
            { key: "userName", label: "사원", clickable: true },
            { key: "startTime", label: "출근시간", render: renderTime },
            { key: "startWork", label: "출근입력시간", render: renderTime }
        ]
    },
    approvalWait: {
        hasCrud: false,
        title: "근태관리",
        apiUrl: "/api/hr/approvalWait",
        idKey: "approvaId",
        // 필터 조건 필드
        filterFields: [
            { id: "keyword", label: "구분", type: "text", placeholder: "전체" },
            { id: "category", label: "성명", type: "text", placeholder: "성명" }
        ],
        tap: [{ id: "departmentId", label: "팀별", type: "groupButton", option:[]}],
        // 표(Table)에 보여줄 컬럼들
        columns: [
            { key: "approvaDate", label: "일자", render: renderDate },
            { key: "approvaId", label: "문서번호"},
            { key: "approvaTitle", label: "제목" },
            { key: "writer", label: "기안자" },
            { key: "documentName", label: "구분" },
            { key: "approvaState", label: "결재", type: "select",
                options: [
                    { label: "결재대기", value: "결재대기" },
                    { label: "결재", value: "결재" },
                    { label: "반려", value: "반려" }
                ]
            },
            { key: "memo", label: "비고" }
        ]
    },
    user:{
        apiUrl: "/api/hr/attendances/put/user",
        filterFields: [],
        columns: [],
        modalOnly: true
    },
    allowance:{
        apiUrl: "/api/hr/attendances/put/allowance",
        filterFields: [],
        columns: [],
        modalOnly: true
    },
    calendar: {
        hasCrud: true,
        title: "출/퇴근기록부",
        apiUrl: "/api/hr/attendances/calendar-data",
        idKey: "workId",
        tap: [{id: "departmentId", label: "팀별", type: "groupButton", option: []}],
        count: [{key: "totalCount", label: "date", clickable: true}],
        // 표(Table)에 보여줄 컬럼들
        columns: [
            {key: "workDate", label: "일자"},
            {key: "userName", label: "성명", clickable: true},
            {key: "departmentName", label: "소속부서"},
            {key: "startWork", label: "출근시간"},
            {key: "finishWork", label: "퇴근시간"}
        ]
    }
}