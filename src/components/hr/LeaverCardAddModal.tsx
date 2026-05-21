import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { ChangeEvent, FormEvent } from "react";
import type { HrCard } from "../../types/HrCard";
import { useGetHrCardList } from "../../apis/hr/HrCardService";
import { usePostLeaverCard } from "../../apis/hr/LeaverCardService";
import Modal from "../Modal";
import "../../assets/styles/hr/leaverAddCardModal.css";
import { createHrGradeOptions } from "../../constants/hrGradeOptions";
import { getHrGradeNameById } from "../../constants/hrGradeOptions";

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

type LeaverCardFormState = {
    employeeId: string;
    userName: string;
    startDate: string;
    quitDate: string;
    departmentId: string;
    gradeName: string;
};

type DateParts = {
    year: string;
    month: string;
    day: string;
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

type DateSelectInputProps = {
    value: string;
    onChange: (value: string) => void;
    minYear: number;
    maxYear: number;
    calendarLabel: string;
    disabled?: boolean;
};

const initialForm: LeaverCardFormState = {
    employeeId: "",
    userName: "",
    startDate: "",
    quitDate: "",
    departmentId: "",
    gradeName: "",
};

const DEPARTMENT_QUERY_KEY = ["departmentOptions"] as const;
const GRADE_QUERY_KEY = ["gradeOptions"] as const;
const DEPARTMENT_API_BASE = "/api/base/dept";
const EXCLUDED_DEPARTMENT_IDS = new Set([1]);
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

const DEPARTMENT_CODE_BY_ID: Record<number, string> = {
    1: "council",
    2: "HR-1",
    3: "WML-1",
    4: "ACLE-1",
};

const normalizeText = (value: string) => value.trim().replace(/\s+/g, "").toLowerCase();

const getCanonicalGradeName = (value?: string | null) => {
    const trimmed = value?.trim() ?? "";
    return trimmed ? GRADE_NAME_ALIASES[trimmed] ?? trimmed : "";
};

const normalizeGradeText = (value: string) => normalizeText(getCanonicalGradeName(value));

const getDateParts = (value: string): DateParts => {
    const [year = "", month = "", day = ""] = value.split("-");
    return { year, month, day };
};

const formatDateValue = ({ year, month, day }: DateParts) => {
    if (!year || !month || !day) {
        return "";
    }

    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

const validateLeaverAddDates = (startDate: string, quitDate: string) => {
    if (startDate && quitDate && startDate > quitDate) {
        throw new Error("퇴사일은 입사일보다 빠를 수 없습니다.");
    }
};

const getDaysInMonth = (year: string, month: string) => {
    if (!year || !month) {
        return 31;
    }

    return new Date(Number(year), Number(month), 0).getDate();
};

const includesAnyNormalized = (value: string, keywords: string[]) =>
    keywords.some((keyword) => normalizeText(value).includes(normalizeText(keyword)));

const isSelectableGrade = (gradeName: string) =>
    !includesAnyNormalized(getCanonicalGradeName(gradeName), HIDDEN_GRADE_KEYWORDS);

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
    return code || DEPARTMENT_CODE_BY_ID[department.departmentId] || "";
};

const findGradeByName = (grades: Grade[], value: string) => {
    const normalizedValue = normalizeGradeText(value);

    if (!normalizedValue) {
        return undefined;
    }

    return grades.find((grade) => normalizeGradeText(grade.gradeName) === normalizedValue);
};

const getResolvedGradeName = (gradeName?: string | null, gradeId?: number) => {
    const canonicalGradeName = getCanonicalGradeName(gradeName);
    return canonicalGradeName || getHrGradeNameById(gradeId);
};

const buildGradeOptions = () => createHrGradeOptions();

const DateSelectInput = ({
                             value,
                             onChange,
                             minYear,
                             maxYear,
                             calendarLabel,
                             disabled = false,
                         }: DateSelectInputProps) => {
    const [parts, setParts] = useState<DateParts>(() => getDateParts(value));
    const dateInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setParts(getDateParts(value));
    }, [value]);

    const yearOptions = useMemo(
        () =>
            Array.from({ length: maxYear - minYear + 1 }, (_, index) =>
                String(maxYear - index)
            ),
        [maxYear, minYear]
    );

    const monthOptions = useMemo(
        () => Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0")),
        []
    );

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
                    disabled={disabled}
                    onChange={(event) => updatePart("year", event.target.value)}
                    aria-label="연도"
                >
                    <option value="">연도</option>
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
                    disabled={disabled}
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
                    disabled={disabled}
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
                    disabled={disabled}
                    onChange={(event) => {
                        const nextValue = event.target.value;
                        setParts(getDateParts(nextValue));
                        onChange(nextValue);
                    }}
                    tabIndex={-1}
                    aria-hidden="true"
                />
                <button
                    type="button"
                    className="hrCardAddModal-dateCalendarButton"
                    onClick={openNativePicker}
                    disabled={disabled}
                    aria-label={calendarLabel}
                >
                    <svg className="hrCardAddModal-dateCalendarIcon" viewBox="0 0 24 24">
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

const LeaverCardAddModal = ({ isOpen, onClose }: Props) => {
    const [form, setForm] = useState<LeaverCardFormState>(initialForm);
    const [selectedEmployeeUserId, setSelectedEmployeeUserId] = useState<number | null>(null);
    const addLeaverCard = usePostLeaverCard();
    const formId = "leaver-card-add-form";

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

    const { data: hrCardOptions = [] } = useGetHrCardList() as {
        data?: HrCard[];
    };

    const searchableDepartments = useMemo(() => {
        return departmentOptions
            .filter(
                (department) =>
                    department.departmentIsUse !== 0 &&
                    department.departmentName?.trim() &&
                    !EXCLUDED_DEPARTMENT_IDS.has(department.departmentId)
            )
            .sort((left, right) => left.departmentName.localeCompare(right.departmentName, "ko"));
    }, [departmentOptions]);

    const searchableGrades = useMemo(() => {
        return gradeOptions
            .filter((grade) => grade.gradeName?.trim() && isSelectableGrade(grade.gradeName))
            .map((grade) => ({
                ...grade,
                gradeName: getCanonicalGradeName(grade.gradeName),
            }))
            .sort((left, right) => left.gradeId - right.gradeId);
    }, [gradeOptions]);

    const activeEmployees = useMemo(() => {
        return hrCardOptions.filter((employee: HrCard) => !employee.quitDate?.trim());
    }, [hrCardOptions]);

    const selectedDepartment = useMemo(
        () => findDepartmentById(searchableDepartments, form.departmentId),
        [searchableDepartments, form.departmentId]
    );

    const selectedGrade = useMemo(
        () => findGradeByName(searchableGrades, form.gradeName),
        [searchableGrades, form.gradeName]
    );

    const resolvedDepartmentCord = selectedDepartment
        ? getDepartmentCord(selectedDepartment)
        : "";

    const gradeIdValue = selectedGrade ? String(selectedGrade.gradeId) : "";

    const matchingEmployees = useMemo(() => {
        if (!form.departmentId.trim() || !form.gradeName.trim()) {
            return [];
        }

        return activeEmployees
            .filter(
                (employee: HrCard) =>
                    String(employee.departmentId) === form.departmentId &&
                    normalizeGradeText(getResolvedGradeName(employee.gradeName, employee.gradeId)) ===
                    normalizeGradeText(form.gradeName)
            )
            .sort((left: HrCard, right: HrCard) =>
                String(left.userName ?? "").localeCompare(String(right.userName ?? ""), "ko")
            );
    }, [activeEmployees, form.departmentId, form.gradeName]);

    const selectedEmployee = useMemo(() => {
        if (selectedEmployeeUserId === null) {
            return null;
        }

        return (
            matchingEmployees.find(
                (employee: HrCard) => employee.userId === selectedEmployeeUserId
            ) ?? null
        );
    }, [matchingEmployees, selectedEmployeeUserId]);

    const employeeSelectionMessage = useMemo(() => {
        if (!form.departmentId.trim() || !form.gradeName.trim()) {
            return "부서와 직급을 먼저 선택해 주세요.";
        }

        if (matchingEmployees.length === 0) {
            return "선택한 조건에 맞는 직원이 없습니다.";
        }

        return "이름을 선택하면 입사일이 자동 입력됩니다.";
    }, [form.departmentId, form.gradeName, matchingEmployees.length]);

    useEffect(() => {
        if (
            selectedEmployeeUserId === null ||
            matchingEmployees.some(
                (employee: HrCard) => employee.userId === selectedEmployeeUserId
            )
        ) {
            return;
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedEmployeeUserId(null);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm((prev) => ({
            ...prev,
            employeeId: "",
            userName: "",
            startDate: "",
            quitDate: "",
        }));
    }, [matchingEmployees, selectedEmployeeUserId]);

    const handleClose = () => {
        setSelectedEmployeeUserId(null);
        setForm(initialForm);
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    const handleChange = (
        event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = event.target;

        if (name === "departmentId") {
            setSelectedEmployeeUserId(null);
            setForm((prev) => ({
                ...prev,
                departmentId: value,
                employeeId: "",
                userName: "",
                startDate: "",
                quitDate: "",
            }));
            return;
        }

        if (name === "gradeName") {
            setSelectedEmployeeUserId(null);
            setForm((prev) => ({
                ...prev,
                gradeName: value,
                employeeId: "",
                userName: "",
                startDate: "",
                quitDate: "",
            }));
            return;
        }

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSelectEmployee = (employee: HrCard) => {
        if (employee.userId === undefined) {
            return;
        }

        setSelectedEmployeeUserId(employee.userId);
        setForm((prev) => ({
            ...prev,
            employeeId: String(employee.employeeId ?? ""),
            userName: employee.userName ?? "",
            startDate: employee.startDate ?? "",
            quitDate: "",
            departmentId: employee.departmentId ? String(employee.departmentId) : prev.departmentId,
            gradeName: getResolvedGradeName(employee.gradeName, employee.gradeId),
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            if (selectedEmployeeUserId === null) {
                throw new Error("퇴사 처리할 직원을 선택해 주세요.");
            }

            if (!form.quitDate.trim()) {
                throw new Error("퇴사일을 입력해 주세요.");
            }

            validateLeaverAddDates(form.startDate.trim(), form.quitDate.trim());

            const payload = {
                userId: selectedEmployeeUserId,
                quitDate: form.quitDate.trim(),
            };

            await addLeaverCard.mutateAsync(payload);
            handleClose();
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "퇴사자 카드 등록에 실패했습니다.";

            console.error(error);
            alert(message);
        }
    };

    const footer = (
        <div className="btn-Wrap">
            <button
                type="submit"
                form={formId}
                className="btn-Primary"
                disabled={addLeaverCard.isPending}
            >
                {addLeaverCard.isPending ? "저장 중..." : "저장"}
            </button>
            <button
                type="button"
                className="btn-Secondary"
                onClick={handleClose}
            >
                취소
            </button>
        </div>
    );

    return (
            <Modal
                title="퇴사자 카드 등록"
                isOpen={isOpen}
                onClose={handleClose}
                footer={footer}
            >
                <form id={formId} onSubmit={handleSubmit}>
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
                                        부서를 선택해 주세요
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
                                <label>부서 코드</label>
                                <input
                                    name="departmentCord"
                                    type="text"
                                    value={resolvedDepartmentCord}
                                    readOnly
                                    title="선택한 부서에 따라 자동 입력됩니다."
                                />
                            </div>
                        </div>
                    </div>
                    <div className="modal-Row">
                        <div className="modal-Row-Group">
                            <div className="modal-Row-Item">
                                <label >직급/직책</label>
                                <select
                                    name="gradeName"
                                    value={form.gradeName}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="" disabled>
                                        직급을 선택해 주세요
                                    </option>
                                    {searchableGrades.map((grade) => (
                                        <option key={grade.gradeId} value={grade.gradeName}>
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
                                    value={gradeIdValue}
                                    readOnly
                                    required
                                    title="선택한 직급에 따라 자동 입력됩니다."
                                />
                            </div>
                        </div>
                    </div>
                    <div className="modal-Row">
                            <label>이름</label>
                            {matchingEmployees.length > 0 ? (
                                <div style={{width:"100%"}}>
                                    {matchingEmployees.map((employee: HrCard) => {
                                        const isSelected =
                                            employee.userId === selectedEmployeeUserId;

                                        return (
                                            <button
                                                key={employee.userId}
                                                type="button"
                                                className={`leaverCardAddModal-employeeChip${
                                                    isSelected ? " is-selected" : ""
                                                }`}
                                                onClick={() => handleSelectEmployee(employee)}
                                            >
                                                <span>
                                                    {employee.userName}
                                                </span>
                                                <span>
                                                    {employee.employeeId}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="leaverCardAddModal-employeeEmpty">
                                    {employeeSelectionMessage}
                                </div>
                            )}


                        </div>
                    <div className="modal-Row">
                        <label></label>
                        {selectedEmployee && (
                            <span className="leaverCardAddModal-employeeHint">
                                        선택된 직원: {selectedEmployee.userName} (
                                {selectedEmployee.employeeId})
                                    </span>
                        )}
                    </div>
                    <div className="modal-Row">
                        <label>입사일</label>
                        <DateSelectInput
                            value={form.startDate}
                            onChange={(nextValue) =>
                                setForm((prev) => ({ ...prev, startDate: nextValue }))
                        }
                            disabled
                            minYear={CURRENT_YEAR - 30}
                            maxYear={CURRENT_YEAR + 5}
                            calendarLabel="입사일 달력 열기"
                        />
                    </div>

                    <div className="modal-Row">
                        <label>퇴사일</label>
                        <DateSelectInput
                            value={form.quitDate}
                            onChange={(nextValue) =>
                                setForm((prev) => ({ ...prev, quitDate: nextValue }))
                        }
                            disabled={selectedEmployeeUserId === null}
                            minYear={CURRENT_YEAR - 30}
                            maxYear={CURRENT_YEAR + 5}
                            calendarLabel="퇴사일 달력 열기"
                        />
                    </div>
                </form>
            </Modal>
    );
};

export default LeaverCardAddModal;
