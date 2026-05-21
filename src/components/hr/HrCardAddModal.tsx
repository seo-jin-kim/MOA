import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { ChangeEvent, FormEvent } from "react";
import {
    usePostHrCard,
    type HrCardMutationPayload,
} from "../../apis/hr/HrCardService";
import Modal from "../Modal";
import "../../assets/styles/hr/hrPage.css";
import { createHrGradeOptions } from "../../constants/hrGradeOptions";
import { openDaumPostcode } from "../../utils/daumPostcode";

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

type HrCardFormState = {
    employeeId: string;
    userName: string;
    password: string;
    birth: string;
    roleId: string;
    departmentId: string;
    departmentCord: string;
    departmentName: string;
    gradeId: string;
    gradeName: string;
    email: string;
    startDate: string;
    phone: string;
    bank: string;
    accountOwner: string;
    accountNum: string;
    address: string;
    performance: string;
};

type DateParts = {
    year: string;
    month: string;
    day: string;
};

type EmailParts = {
    local: string;
    domain: string;
};

type PhoneParts = {
    first: string;
    middle: string;
    last: string;
};

type Department = {
    departmentId: number;
    departmentCord?: string;
    departmentName: string;
    departmentIsUse?: number;
};

type Grade = {
    gradeId: number;
    gradeName: string;
};

type DepartmentResponse = Department[] | { content?: Department[]; value?: Department[] };
type DepartmentKey = "HR" | "WML" | "ACLE";
type GradeGroup = "EXECUTIVE" | "LEAD" | "STAFF";

type RoleOption = {
    roleId: number;
    code: string;
    label: string;
};

type DateSelectInputProps = {
    value: string;
    onChange: (value: string) => void;
    minYear: number;
    maxYear: number;
    calendarLabel: string;
};

const initialForm: HrCardFormState = {
    employeeId: "",
    userName: "",
    password: "",
    birth: "",
    roleId: "",
    departmentId: "",
    departmentCord: "",
    departmentName: "",
    gradeId: "",
    gradeName: "",
    email: "",
    startDate: "",
    phone: "",
    bank: "",
    accountOwner: "",
    accountNum: "",
    address: "",
    performance: "",
};

const ROLE_OPTIONS: Record<string, RoleOption> = {
    EXECUTIVE: { roleId: 1, code: "C", label: "임원" },
    "HR:LEAD": { roleId: 2, code: "HR-R", label: "인사팀장" },
    "WML:LEAD": { roleId: 3, code: "WML-R", label: "물류팀장" },
    "ACLE:LEAD": { roleId: 4, code: "ACLE-R", label: "회계팀장" },
    "HR:STAFF": { roleId: 5, code: "HR-E", label: "인사 사원" },
    "WML:STAFF": { roleId: 6, code: "WML-E", label: "물류 사원" },
    "ACLE:STAFF": { roleId: 7, code: "ACLE-E", label: "영업 사원" },
};

const DEPARTMENT_QUERY_KEY = ["departmentOptions"] as const;
const GRADE_QUERY_KEY = ["gradeOptions"] as const;
const DEPARTMENT_API_BASE = "/api/base/dept";
const EXCLUDED_DEPARTMENT_KEYWORDS = ["이사회"];
const HIDDEN_GRADE_KEYWORDS = ["부장", "상무", "부사장", "사장", "임원", "이사"];
const CURRENT_YEAR = new Date().getFullYear();
const GRADE_NAME_ALIASES: Record<string, string> = {
    President: "사장",
    President7: "사장",
    "Vice President": "부사장",
    "Executive Director": "상무",
    "General Manager": "부장",
    "Deputy General Manager": "과장",
    "Assistant Manager": "대리",
    Employee: "사원",
};
const DEPARTMENT_KEY_BY_ID: Record<number, DepartmentKey> = {
    1: "HR",
    2: "HR",
    3: "WML",
    4: "ACLE",
};
const DEPARTMENT_CODE_BY_ID: Record<number, string> = {
    1: "council",
    2: "HR-1",
    3: "WML-1",
    4: "ACLE-1",
};

const toNullable = (value: string) => {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
};

const toRequiredNumber = (value: string, label: string) => {
    const trimmed = value.trim();
    const parsed = Number(trimmed);

    if (trimmed === "" || !Number.isFinite(parsed)) {
        throw new Error(`${label}를 숫자로 입력해 주세요.`);
    }

    return parsed;
};

const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const validateHrCardDates = ({
    birth,
    startDate,
    quitDate,
}: {
    birth: string;
    startDate: string;
    quitDate?: string;
}) => {
    const today = getTodayDateString();

    if (birth && birth > today) {
        throw new Error("생년월일은 오늘 이후 날짜로 입력할 수 없습니다.");
    }

    if (birth && startDate && birth > startDate) {
        throw new Error("생년월일은 입사일보다 늦을 수 없습니다.");
    }

    if (birth && quitDate && birth > quitDate) {
        throw new Error("생년월일은 퇴사일보다 늦을 수 없습니다.");
    }

    if (startDate && quitDate && startDate > quitDate) {
        throw new Error("퇴사일은 입사일보다 빠를 수 없습니다.");
    }
};

const normalizeText = (value: string) => {
    return value.trim().replace(/\s+/g, "").toLowerCase();
};

const getCanonicalGradeName = (value?: string | null) => {
    const trimmed = value?.trim() ?? "";

    if (!trimmed) {
        return "";
    }

    return GRADE_NAME_ALIASES[trimmed] ?? trimmed;
};

const normalizeGradeText = (value: string) => {
    return normalizeText(getCanonicalGradeName(value));
};

const getDateParts = (value: string): DateParts => {
    const [year = "", month = "", day = ""] = value.split("-");
    return { year, month, day };
};

const getEmailParts = (value: string): EmailParts => {
    if (!value) {
        return { local: "", domain: "" };
    }

    const atIndex = value.indexOf("@");

    if (atIndex === -1) {
        return { local: value, domain: "" };
    }

    return {
        local: value.slice(0, atIndex),
        domain: value.slice(atIndex + 1),
    };
};

const getPhoneParts = (value: string): PhoneParts => {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    return {
        first: digits.slice(0, 3),
        middle: digits.slice(3, 7),
        last: digits.slice(7, 11),
    };
};

const formatDateValue = ({ year, month, day }: DateParts) => {
    if (!year || !month || !day) {
        return "";
    }

    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

const formatEmailValue = (local: string, domain: string) => {
    const safeLocal = local.replace(/@/g, "").trim();
    const safeDomain = domain.replace(/@/g, "").trim();

    if (!safeLocal && !safeDomain) {
        return "";
    }

    if (!safeDomain) {
        return safeLocal;
    }

    if (!safeLocal) {
        return `@${safeDomain}`;
    }

    return `${safeLocal}@${safeDomain}`;
};

const formatPhoneValue = (first: string, middle: string, last: string) => {
    const safeFirst = first.replace(/\D/g, "").slice(0, 3);
    const safeMiddle = middle.replace(/\D/g, "").slice(0, 4);
    const safeLast = last.replace(/\D/g, "").slice(0, 4);

    return [safeFirst, safeMiddle, safeLast].filter(Boolean).join("-");
};

const getDaysInMonth = (year: string, month: string) => {
    if (!year || !month) {
        return 31;
    }

    return new Date(Number(year), Number(month), 0).getDate();
};

const includesAnyNormalized = (value: string, keywords: string[]) => {
    const normalizedValue = normalizeText(value);

    return keywords.some((keyword) =>
        normalizedValue.includes(normalizeText(keyword))
    );
};

const isSelectableGrade = (gradeName: string) => {
    return !includesAnyNormalized(getCanonicalGradeName(gradeName), HIDDEN_GRADE_KEYWORDS);
};

const findDepartmentById = (departments: Department[], value: string) => {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
        return undefined;
    }

    return departments.find(
        (department) => String(department.departmentId) === normalizedValue
    );
};

const getDepartmentCord = (department?: Department) => {
    if (!department) {
        return "";
    }

    const code = department.departmentCord?.trim();

    if (code) {
        return code;
    }

    return DEPARTMENT_CODE_BY_ID[department.departmentId] ?? "";
};

const findGradeById = (grades: Grade[], value: string) => {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
        return undefined;
    }

    return grades.find((grade) => String(grade.gradeId) === normalizedValue);
};

const buildGradeOptions = () => createHrGradeOptions();

const getDepartmentKey = (
    departmentId: number | string | null | undefined,
    departmentName: string
): DepartmentKey | undefined => {
    const normalizedDepartment = normalizeText(departmentName);

    if (normalizedDepartment) {
        if (normalizedDepartment.includes("인사") || normalizedDepartment.includes("hr")) {
            return "HR";
        }

        if (normalizedDepartment.includes("물류") || normalizedDepartment.includes("wml")) {
            return "WML";
        }

        if (
            normalizedDepartment.includes("영업") ||
            normalizedDepartment.includes("회계") ||
            normalizedDepartment.includes("acle")
        ) {
            return "ACLE";
        }
    }

    const parsedDepartmentId =
        typeof departmentId === "string" ? Number(departmentId.trim()) : departmentId;

    if (
        typeof parsedDepartmentId === "number" &&
        Number.isFinite(parsedDepartmentId) &&
        DEPARTMENT_KEY_BY_ID[parsedDepartmentId]
    ) {
        return DEPARTMENT_KEY_BY_ID[parsedDepartmentId];
    }

    return undefined;
};


const getGradeGroup = (gradeName: string): GradeGroup | undefined => {
    const normalizedGrade = normalizeGradeText(gradeName);

    if (!normalizedGrade) {
        return undefined;
    }

    if (
        ["임원", "사장", "부사장", "상무"].some((keyword) =>
            normalizedGrade.includes(normalizeText(keyword))
        )
    ) {
        return "EXECUTIVE";
    }

    if (
        ["팀장", "부장"].some((keyword) =>
            normalizedGrade.includes(normalizeText(keyword))
        )
    ) {
        return "LEAD";
    }

    if (
        ["사원", "대리", "과장"].some((keyword) =>
            normalizedGrade.includes(normalizeText(keyword))
        )
    ) {
        return "STAFF";
    }

    return undefined;
};

const getRoleOption = (
    departmentId: number | string | null | undefined,
    departmentName: string,
    gradeName: string
) => {
    const gradeGroup = getGradeGroup(gradeName);

    if (!gradeGroup) {
        return undefined;
    }

    if (gradeGroup === "EXECUTIVE") {
        return ROLE_OPTIONS.EXECUTIVE;
    }

    const departmentKey = getDepartmentKey(departmentId, departmentName);

    if (!departmentKey) {
        return undefined;
    }

    return ROLE_OPTIONS[`${departmentKey}:${gradeGroup}`];
};

const DateSelectInput = ({
                             value,
                             onChange,
                             minYear,
                             maxYear,
                             calendarLabel,
                         }: DateSelectInputProps) => {
    const parsedValue = useMemo(() => getDateParts(value), [value]);
    const [parts, setParts] = useState<DateParts>(parsedValue);
    const dateInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setParts(parsedValue);
    }, [parsedValue]);

    const yearOptions = useMemo(() => {
        return Array.from(
            { length: maxYear - minYear + 1 },
            (_, index) => String(maxYear - index)
        );
    }, [maxYear, minYear]);

    const monthOptions = useMemo(() => {
        return Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
    }, []);

    const dayOptions = useMemo(() => {
        const dayCount = getDaysInMonth(parts.year, parts.month);
        return Array.from({ length: dayCount }, (_, index) =>
            String(index + 1).padStart(2, "0")
        );
    }, [parts.month, parts.year]);

    const updatePart = (key: keyof DateParts, nextValue: string) => {
        setParts((prev) => {
            const nextParts = { ...prev, [key]: nextValue };

            if (
                (key === "year" || key === "month") &&
                nextParts.day &&
                Number(nextParts.day) > getDaysInMonth(nextParts.year, nextParts.month)
            ) {
                nextParts.day = "";
            }

            onChange(formatDateValue(nextParts));
            return nextParts;
        });
    };

    const openNativePicker = () => {
        const input = dateInputRef.current;

        if (!input) {
            return;
        }

        const pickerInput = input as HTMLInputElement & {
            showPicker?: () => void;
        };

        if (pickerInput.showPicker) {
            pickerInput.showPicker();
            return;
        }

        input.focus();
        input.click();
    };

    return (
        <div style={{display: "flex", alignItems: "center", gap: "10px",width:"100%"}}>
            <div className="hrCardAddModal-dateBox--year">
                <select
                    value={parts.year}
                    onChange={(event) => updatePart("year", event.target.value)}
                    aria-label="연도"
                >
                    <option value="" >연도</option>
                    {yearOptions.map((year) => (
                        <option key={year} value={year}>
                            {year}
                        </option>
                    ))}
                </select>
            </div>

            <span>/</span>

            <div className="hrCardAddModal-dateBox--month">
                <select
                    value={parts.month}
                    onChange={(event) => updatePart("month", event.target.value)}
                    aria-label="월"
                >
                    <option value="">월</option>
                    {monthOptions.map((month) => (
                        <option key={month} value={month}>
                            {month}
                        </option>
                    ))}
                </select>
            </div>

            <span >/</span>

            <div className="hrCardAddModal-dateBox--day">
                <select
                    value={parts.day}
                    onChange={(event) => updatePart("day", event.target.value)}
                    aria-label="일"
                >
                    <option value="">일</option>
                    {dayOptions.map((day) => (
                        <option key={day} value={day}>
                            {day}
                        </option>
                    ))}
                </select>
            </div>

            <div className="hrCardAddModal-dateCalendarWrap">
                <input
                    ref={dateInputRef}
                    className="hrCardAddModal-dateNativeInput"
                    type="date"
                    value={value}
                    min={`${minYear}-01-01`}
                    max={`${maxYear}-12-31`}
                    onChange={(event) => onChange(event.target.value)}
                    tabIndex={-1}
                    aria-hidden="true"
                />
                <button
                    type="button"
                    className="hrCardAddModal-dateCalendarButton"
                    onClick={openNativePicker}
                    aria-label={calendarLabel}
                >
                    <svg
                        className="hrCardAddModal-dateCalendarIcon"
                        viewBox="0 0 24 24"
                    >
                        <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
                        <path d="M7.5 3.5v3" />
                        <path d="M16.5 3.5v3" />
                        <path d="M3.5 9.5h17" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

const HrCardAddModal = ({ isOpen, onClose }: Props) => {
    const [form, setForm] = useState<HrCardFormState>(initialForm);
    const addHrCard = usePostHrCard();
    const queryClient = useQueryClient();
    const formId = "hr-card-add-form";

    const { data: departmentOptions = [] } = useQuery<Department[]>({
        queryKey: DEPARTMENT_QUERY_KEY,
        enabled: isOpen,
        queryFn: async () => {
            const response = await axios.get<DepartmentResponse>(DEPARTMENT_API_BASE, {
                withCredentials: true,
            });

            return Array.isArray(response.data)
                ? response.data
                : response.data.content ?? response.data.value ?? [];
        },
    });

    const { data: gradeOptions = [] } = useQuery<Grade[]>({
        queryKey: GRADE_QUERY_KEY,
        enabled: isOpen,
        initialData: buildGradeOptions,
        queryFn: async () => buildGradeOptions(),
    });

    const searchableDepartments = useMemo(() => {
        return departmentOptions
            .filter(
                (department) =>
                    department.departmentIsUse !== 0 &&
                    department.departmentName?.trim() &&
                    (department.departmentId !== 1 || EXCLUDED_DEPARTMENT_KEYWORDS.length === 0)
            )
            .sort((left, right) =>
                left.departmentName.localeCompare(right.departmentName, "ko")
            );
    }, [departmentOptions]);

    const searchableGrades = useMemo(() => {
        return gradeOptions
            .filter(
                (grade) => grade.gradeName?.trim() && isSelectableGrade(grade.gradeName)
            )
            .sort((left, right) => left.gradeId - right.gradeId);
    }, [gradeOptions]);

    const selectedDepartment = useMemo(
        () => findDepartmentById(searchableDepartments, form.departmentId),
        [searchableDepartments, form.departmentId]
    );
    const resolvedDepartmentName = selectedDepartment?.departmentName ?? form.departmentName;
    const resolvedDepartmentCord = selectedDepartment
        ? getDepartmentCord(selectedDepartment)
        : form.departmentCord;
    const emailParts = useMemo(() => getEmailParts(form.email), [form.email]);
    const phoneParts = useMemo(() => getPhoneParts(form.phone), [form.phone]);
    const selectedRole = useMemo(() => {
        return getRoleOption(form.departmentId, resolvedDepartmentName, form.gradeName);
    }, [form.departmentId, resolvedDepartmentName, form.gradeName]);




    if (!isOpen) {
        return null;
    }

    const handleChange = (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = event.target;

        if (name === "departmentId") {
            const matchedDepartment = findDepartmentById(searchableDepartments, value);

            setForm((prev) => ({
                ...prev,
                departmentId: matchedDepartment ? String(matchedDepartment.departmentId) : "",
                departmentCord: getDepartmentCord(matchedDepartment),
                departmentName: matchedDepartment ? matchedDepartment.departmentName : "",
            }));
            return;
        }

        if (name === "gradeId") {
            const matchedGrade = findGradeById(searchableGrades, value);

            setForm((prev) => ({
                ...prev,
                gradeName: matchedGrade ? matchedGrade.gradeName : "",
                gradeId: matchedGrade ? String(matchedGrade.gradeId) : "",
            }));
            return;
        }

        if (name === "departmentCord" || name === "roleId") {
            return;
        }

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            const submitRoleId = selectedRole ? String(selectedRole.roleId) : form.roleId;

            validateHrCardDates({
                birth: form.birth.trim(),
                startDate: form.startDate.trim(),
            });

            const payload: HrCardMutationPayload = {
                employeeId: form.employeeId.trim(),
                userName: form.userName.trim(),
                password: form.password.trim(),
                birth: toNullable(form.birth),
                roleId: toRequiredNumber(submitRoleId, "권한 코드"),
                departmentId: toRequiredNumber(form.departmentId, "부서 코드"),
                departmentName: toNullable(resolvedDepartmentName),
                gradeId: toRequiredNumber(form.gradeId, "직급 코드"),
                gradeName: toNullable(form.gradeName),
                email: toNullable(form.email),
                startDate: toNullable(form.startDate) ?? undefined,
                phone: toNullable(form.phone),
                bank: toNullable(form.bank),
                accountOwner: toNullable(form.accountOwner),
                accountNum: toNullable(form.accountNum),
                address: toNullable(form.address),
                performance: toNullable(form.performance),
            };

            console.log("등록 payload:", payload);

            await addHrCard.mutateAsync(payload);

            await queryClient.invalidateQueries({
                queryKey: ["hrCardList"],
            });

            setForm(initialForm);
            onClose();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("상태코드:", error.response?.status);
                console.error("서버응답:", error.response?.data);
                alert(JSON.stringify(error.response?.data));
                return;
            }

            const message =
                error instanceof Error ? error.message : "인사카드 등록에 실패했습니다.";

            console.error(error);
            alert(message);
        }
    };

    const updateEmail = (nextLocal: string, nextDomain: string) => {
        setForm((prev) => ({
            ...prev,
            email: formatEmailValue(nextLocal, nextDomain),
        }));
    };

    const updatePhone = (part: keyof PhoneParts, nextValue: string) => {
        const nextParts = {
            ...phoneParts,
            [part]: nextValue,
        };

        setForm((prev) => ({
            ...prev,
            phone: formatPhoneValue(nextParts.first, nextParts.middle, nextParts.last),
        }));
    };

    const handleSearchAddress = async () => {
        try {
            const selectedAddress = await openDaumPostcode();

            if (!selectedAddress) {
                return;
            }

            setForm((prev) => ({
                ...prev,
                address: selectedAddress,
            }));
        } catch (error) {
            console.error(error);
            alert("주소 검색 서비스를 불러오지 못했습니다.");
        }
    };
    const footer = (
        <div className="btn-Wrap">
            <button
                type="submit"
                form={formId}
                className="btn-Primary"
                disabled={addHrCard.isPending}
            >
                {addHrCard.isPending ? "저장 중..." : "저장"}
            </button>
            <button
                type="button"
                className="btn-Secondary"
                onClick={() => {
                    setForm(initialForm);
                    onClose();
                }}
            >
                취소
            </button>
        </div>
    );

    return (
            <Modal
            title="인사카드 등록"
            isOpen={isOpen}
            onClose={onClose}
            footer={footer}
        >
                <form id={formId} onSubmit={handleSubmit}>
                        <div className="modal-Row">
                            <div className="modal-Row-Group">
                                <div className="modal-Row-Item">
                                    <label>사번번호</label>
                                    <input
                                        name="employeeId"
                                        type="text"
                                        value={form.employeeId}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="modal-Row-Item">
                                    <label>성명</label>
                                    <input
                                        name="userName"
                                        type="text"
                                        value={form.userName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    <div className="modal-Row">
                        <div className="modal-Row-Group">
                            <div className="modal-Row-Item">
                                <label>직급/직책</label>
                                <select
                                    name="gradeId"
                                    value={form.gradeId}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="" disabled>
                                        직급을 선택하세요
                                    </option>
                                    {searchableGrades.map((grade) => (
                                        <option
                                            key={grade.gradeId}
                                            value={String(grade.gradeId)}
                                        >
                                            {grade.gradeName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-Row-Item">
                                <label>직급 코드</label>
                                <input
                                    name="gradeId"
                                    type="text"
                                    value={form.gradeId}
                                    readOnly
                                    required
                                    title="선택한 직급에 따라 자동 입력됩니다."
                                />
                            </div>
                        </div>
                    </div>
                            <div className="modal-Row">
                                <div className="modal-Row-Group">
                                    <div className="modal-Row-Item">
                                        <label>부서</label>
                                        <select
                                            name="departmentId"
                                            value={form.departmentId}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="" disabled>
                                                부서를 선택하세요
                                            </option>
                                            {searchableDepartments.map((department) => (
                                                <option
                                                    key={department.departmentId}
                                                    value={String(department.departmentId)}
                                                >
                                                    {department.departmentName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="modal-Row-Item">
                                        <label>권한 코드</label>
                                        <input
                                            name="roleId"
                                            type="text"
                                            value={selectedRole ? String(selectedRole.roleId) : ""}
                                            readOnly
                                            required
                                            title="부서와 직급 선택 결과로 자동 입력됩니다."
                                        />
                                    </div>
                                </div>
                            </div>
                                <div className="modal-Row">
                                    <div className="modal-Row-Group">
                                        <div className="modal-Row-Item">
                                            <label>부서 코드</label>
                                            <input
                                                name="departmentCord"
                                                type="text"
                                                value={resolvedDepartmentCord}
                                                readOnly
                                                title="선택한 부서에 따라 자동 입력됩니다."
                                        />
                                    </div>
                                    <div className="modal-Row-Item">
                                        <label>비밀번호</label>
                                        <input
                                            name="password"
                                            type="text"
                                            value={form.password}
                                            onChange={handleChange}
                                            autoComplete="new-password"
                                            required
                                        />
                                    </div>
                                </div>
                                </div>
                                <div className="modal-Row">
                                    <label>이메일</label>
                                    <div style={{display:"flex", width:"100%",alignItems:"center", gap:"6px"}}>
                                        <input
                                            type="text"
                                            value={emailParts.local}
                                            onChange={(event) =>
                                                updateEmail(event.target.value, emailParts.domain)
                                            }
                                            placeholder="id"
                                            inputMode="email"
                                        />
                                        <span>@</span>
                                        <input
                                            type="text"
                                            value={emailParts.domain}
                                            onChange={(event) =>
                                                updateEmail(emailParts.local, event.target.value)
                                            }
                                            placeholder="domain.com"
                                            inputMode="email"
                                        />
                                    </div>
                                </div>

                                <div className="modal-Row">
                                    <label>생년월일</label>
                                    <DateSelectInput
                                        value={form.birth}
                                        onChange={(nextValue) =>
                                            setForm((prev) => ({ ...prev, birth: nextValue }))
                                        }
                                        minYear={1950}
                                        maxYear={CURRENT_YEAR}
                                        calendarLabel="생년월일 달력 열기"
                                    />
                                </div>
                                <div className="modal-Row">
                                    <label>입사일</label>
                                    <DateSelectInput
                                        value={form.startDate}
                                        onChange={(nextValue) =>
                                            setForm((prev) => ({ ...prev, startDate: nextValue }))
                                        }
                                        minYear={CURRENT_YEAR - 30}
                                        maxYear={CURRENT_YEAR + 5}
                                        calendarLabel="입사일 달력 열기"
                                    />
                                </div>
                                <div className="modal-Row">
                                    <label>전화번호</label>
                                    <div style={{display:"flex" , alignItems:"center", gap:"5px"}}>
                                        <input
                                            type="tel"
                                            value={phoneParts.first}
                                            onChange={(event) =>
                                                updatePhone("first", event.target.value)
                                            }
                                            inputMode="numeric"
                                            maxLength={3}
                                            placeholder="010"
                                        />
                                        <span>-</span>
                                        <input
                                            type="tel"
                                            value={phoneParts.middle}
                                            onChange={(event) =>
                                                updatePhone("middle", event.target.value)
                                            }
                                            inputMode="numeric"
                                            maxLength={4}
                                            placeholder="1234"
                                        />
                                        <span>-</span>
                                        <input
                                            type="tel"
                                            value={phoneParts.last}
                                            onChange={(event) =>
                                                updatePhone("last", event.target.value)
                                            }
                                            inputMode="numeric"
                                            maxLength={4}
                                            placeholder="5678"
                                        />
                                    </div>
                                </div>
                                <div className="modal-Row">
                                    <div className="modal-Row-Group">
                                        <div className="modal-Row-Item">
                                            <label>은행</label>
                                            <input
                                                name="bank"
                                                type="text"
                                                value={form.bank}
                                                onChange={handleChange}
                                            />
                                        </div>
    
                                        <div className="modal-Row-Item">
                                            <label >계좌번호</label>
                                            <input
                                                name="accountNum"
                                                type="text"
                                                value={form.accountNum}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-Row">
                                    <div className="modal-Row-Group">
                                        <div className="modal-Row-Item">
                                            <label>예금주</label>
                                            <input
                                                name="accountOwner"
                                                type="text"
                                                value={form.accountOwner}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="modal-Row-Item">
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-Row" style={{gap:"3px"}}>
                                    <label>주소</label>
                                        <input
                                            name="address"
                                            type="text"
                                            value={form.address}
                                            onChange={handleChange}
                                        />
                                        <button
                                            style={{whiteSpace:"nowrap"}}
                                            type="button"
                                            className="btn-Secondary"
                                            onClick={handleSearchAddress}
                                        >
                                            주소검색
                                        </button>
                                    </div>
    
                                <div className="modal-Row">
                                    <label>인사평가</label>
                                    <textarea
                                        className="hrCardAddModal-textarea"
                                        name="performance"
                                        value={form.performance}
                                        rows={3}
                                        onChange={handleChange}
                                    />
                                </div>
                    </form>
                </Modal>
    );
};

export default HrCardAddModal;
