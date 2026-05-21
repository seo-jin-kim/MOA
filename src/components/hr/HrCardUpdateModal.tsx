import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { ChangeEvent, FormEvent } from "react";
import {
    useGetHrCardInfo,
    usePutHrCard as usePutHrCardHook,
    type HrCardMutationPayload,
} from "../../apis/hr/HrCardService";
import ConfirmModal from "../ConfirmModal";
import Modal from "../Modal";
import { useAuthStore } from "../../stores/useAuthStore";
import "../../assets/styles/hr/hrPage.css";
import { createHrGradeOptions } from "../../constants/hrGradeOptions";
import { getHrGradeNameById, resolveHrGradeId } from "../../constants/hrGradeOptions";
import type { HrCard } from "../../types/HrCard";
import { openDaumPostcode } from "../../utils/daumPostcode";

type Props = {
    isOpen: boolean;
    userId?: number | null;
    onClose: () => void;
    restrictEditToHrLead?: boolean;
};

type HrCardWithAccountOwner = HrCard & {
    accountOwner?: string | null;
};

type HrCardFormState = {
    employeeId: string;
    userName: string;
    password: string;
    birth: string;
    startDate: string;
    quitDate: string;
    roleId: string;
    departmentId: string;
    departmentCord: string;
    departmentName: string;
    gradeId: string;
    gradeName: string;
    email: string;
    phone: string;
    bank: string;
    accountOwner: string;
    accountNum: string;
    address: string;
    performance: string;
};

const DIRTY_FORM_KEYS = [
    "employeeId",
    "userName",
    "password",
    "birth",
    "startDate",
    "quitDate",
    "departmentId",
    "gradeId",
    "email",
    "phone",
    "bank",
    "accountOwner",
    "accountNum",
    "address",
    "performance",
] as const;

type DirtyFormKey = (typeof DIRTY_FORM_KEYS)[number];
type ComparableHrCardFormState = Pick<HrCardFormState, DirtyFormKey>;

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
type RoleOption = { roleId: number; code: string; label: string };

type DateInputWithPickerProps = {
    value: string;
    onChange: (value: string) => void;
    readOnly: boolean;
    calendarLabel: string;
};

const DEPARTMENT_API_BASE = "/api/base/dept";
const EXCLUDED_DEPARTMENT_KEYWORDS = ["이사회"];
const HIDDEN_GRADE_KEYWORDS = ["부장", "상무", "부사장", "사장", "임원", "이사"];
const RESTRICTED_EDIT_GRADE_KEYWORDS = ["부장", "상무", "부사장", "사장", "임원", "이사", "팀장"];

const initialForm: HrCardFormState = {
    employeeId: "",
    userName: "",
    password: "",
    birth: "",
    startDate: "",
    quitDate: "",
    roleId: "",
    departmentId: "",
    departmentCord: "",
    departmentName: "",
    gradeId: "",
    gradeName: "",
    email: "",
    phone: "",
    bank: "",
    accountOwner: "",
    accountNum: "",
    address: "",
    performance: "",
};

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

const ROLE_OPTIONS: Record<string, RoleOption> = {
    EXECUTIVE: { roleId: 1, code: "C", label: "임원" },
    "HR:LEAD": { roleId: 2, code: "HR-R", label: "인사팀장" },
    "WML:LEAD": { roleId: 3, code: "WML-R", label: "물류팀장" },
    "ACLE:LEAD": { roleId: 4, code: "ACLE-R", label: "회계팀장" },
    "HR:STAFF": { roleId: 5, code: "HR-E", label: "인사 사원" },
    "WML:STAFF": { roleId: 6, code: "WML-E", label: "물류 사원" },
    "ACLE:STAFF": { roleId: 7, code: "ACLE-E", label: "영업 사원" },
};

const DEPARTMENT_KEY_BY_ID: Record<number, DepartmentKey> = {
    1: "HR",
    2: "HR",
    3: "WML",
    4: "ACLE",
};

const normalizeText = (value: string) => value.trim().replace(/\s+/g, "").toLowerCase();

const toNullable = (value: string) => {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
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
    quitDate: string;
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

const getEmailParts = (value: string) => {
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

const getCanonicalGradeName = (value?: string | null) => {
    const trimmed = value?.trim() ?? "";
    return trimmed ? GRADE_NAME_ALIASES[trimmed] ?? trimmed : "";
};

const normalizeGradeText = (value: string) => normalizeText(getCanonicalGradeName(value));

const includesAnyNormalized = (value: string, keywords: string[]) =>
    keywords.some((keyword) => normalizeText(value).includes(normalizeText(keyword)));

const isSelectableGrade = (gradeName: string) =>
    !includesAnyNormalized(getCanonicalGradeName(gradeName), HIDDEN_GRADE_KEYWORDS);

const isRestrictedEditGrade = (gradeName: string) =>
    includesAnyNormalized(getCanonicalGradeName(gradeName), RESTRICTED_EDIT_GRADE_KEYWORDS);

const buildGradeOptions = () => createHrGradeOptions();

const ensureDepartmentOption = (
    departments: Department[],
    departmentId: string,
    departmentName: string
) => {
    const trimmedDepartmentName = departmentName.trim();

    if (!trimmedDepartmentName) {
        return departments;
    }

    const hasCurrentDepartment = departments.some(
        (department) =>
            String(department.departmentId) === departmentId ||
            normalizeText(department.departmentName) === normalizeText(trimmedDepartmentName)
    );

    if (hasCurrentDepartment) {
        return departments;
    }

    const nextDepartmentId = Number(departmentId);

    return [
        ...departments,
        {
            departmentId: Number.isFinite(nextDepartmentId) ? nextDepartmentId : -1,
            departmentName: trimmedDepartmentName,
            departmentIsUse: 1,
        },
    ];
};

const ensureGradeOption = (grades: Grade[], gradeId: string, gradeName: string) => {
    const canonicalGradeName = getCanonicalGradeName(gradeName);

    if (!canonicalGradeName) {
        return grades;
    }

    const hasCurrentGrade = grades.some(
        (grade) =>
            String(grade.gradeId) === gradeId ||
            normalizeGradeText(grade.gradeName) === normalizeGradeText(canonicalGradeName)
    );

    if (hasCurrentGrade) {
        return grades;
    }

    const nextGradeId = Number(gradeId);

    return [
        ...grades,
        {
            gradeId: Number.isFinite(nextGradeId) ? nextGradeId : -1,
            gradeName: canonicalGradeName,
        },
    ].sort((left, right) => left.gradeId - right.gradeId);
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

const findGradeByName = (grades: Grade[], value: string) => {
    const normalizedValue = normalizeGradeText(value);
    if (!normalizedValue) {
        return undefined;
    }

    return grades.find((grade) => normalizeGradeText(grade.gradeName) === normalizedValue);
};

const getDepartmentKey = (departmentId: string, departmentName: string): DepartmentKey | undefined => {
    const normalizedDepartment = normalizeText(departmentName);

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

    const parsedDepartmentId = Number(departmentId);
    return Number.isFinite(parsedDepartmentId) ? DEPARTMENT_KEY_BY_ID[parsedDepartmentId] : undefined;
};

const getGradeGroup = (gradeName: string): GradeGroup | undefined => {
    const normalizedGrade = normalizeGradeText(gradeName);
    if (!normalizedGrade) {
        return undefined;
    }

    if (["임원", "사장", "부사장", "상무"].some((keyword) =>
        normalizedGrade.includes(normalizeText(keyword))
    )) {
        return "EXECUTIVE";
    }

    if (["팀장", "부장"].some((keyword) =>
        normalizedGrade.includes(normalizeText(keyword))
    )) {
        return "LEAD";
    }

    if (["사원", "대리", "과장"].some((keyword) =>
        normalizedGrade.includes(normalizeText(keyword))
    )) {
        return "STAFF";
    }

    return undefined;
};

const getRoleOption = (departmentId: string, departmentName: string, gradeName: string) => {
    const gradeGroup = getGradeGroup(gradeName);
    if (!gradeGroup) {
        return undefined;
    }

    if (gradeGroup === "EXECUTIVE") {
        return ROLE_OPTIONS.EXECUTIVE;
    }

    const departmentKey = getDepartmentKey(departmentId, departmentName);
    return departmentKey ? ROLE_OPTIONS[`${departmentKey}:${gradeGroup}`] : undefined;
};

const mapCardToForm = (card: HrCardWithAccountOwner): HrCardFormState => {
    const resolvedGradeId = resolveHrGradeId(card.gradeId);

    return ({
    employeeId: String(card.employeeId ?? card.employee_id ?? ""),
    userName: card.userName ?? "",
    password: "",
    birth: card.birth ?? "",
    startDate: card.startDate ?? "",
    quitDate: card.quitDate ?? "",
    roleId: card.roleId ? String(card.roleId) : "",
    departmentId: card.departmentId ? String(card.departmentId) : "",
    departmentCord: "",
    departmentName: card.departmentName?.trim() ?? "",
    gradeId: resolvedGradeId ? String(resolvedGradeId) : "",
    gradeName: getCanonicalGradeName(card.gradeName) || getHrGradeNameById(resolvedGradeId),
    email: card.email ?? "",
    phone: card.phone ?? "",
    bank: card.bank ?? "",
    accountOwner: card.accountOwner ?? "",
    accountNum: card.accountNum ?? "",
    address: card.address ?? "",
    performance: card.performance ?? "",
    });
};

const buildComparableFormState = (
    form: HrCardFormState
): ComparableHrCardFormState => ({
    employeeId: form.employeeId,
    userName: form.userName,
    password: form.password,
    birth: form.birth,
    startDate: form.startDate,
    quitDate: form.quitDate,
    departmentId: form.departmentId,
    gradeId: form.gradeId,
    email: form.email,
    phone: form.phone,
    bank: form.bank,
    accountOwner: form.accountOwner,
    accountNum: form.accountNum,
    address: form.address,
    performance: form.performance,
});

const hasComparableFormChanges = (
    currentForm: ComparableHrCardFormState,
    initialComparableForm: ComparableHrCardFormState
) => DIRTY_FORM_KEYS.some((key) => currentForm[key] !== initialComparableForm[key]);

const DateInputWithPicker = ({
                                 value,
                                 onChange,
                                 readOnly,
                                 calendarLabel,
                             }: DateInputWithPickerProps) => {
    const nativeInputRef = useRef<HTMLInputElement>(null);
    const dateInputClassName = readOnly
        ? "hrCardAddModal-input hrCardAddModal-input--readonly hrCardAddModal-dateInputField"
        : "hrCardAddModal-input hrCardAddModal-dateInputField";

    const openNativePicker = () => {
        if (readOnly) {
            return;
        }

        const input = nativeInputRef.current;
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
        <>
            <input
                type="text"
                className={dateInputClassName}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                readOnly={readOnly}
                placeholder="YYYY-MM-DD"
            />
            <div className="hrCardAddModal-dateCalendarWrap" style={{marginLeft:"3px"}}>
                <input
                    ref={nativeInputRef}
                    className="hrCardAddModal-dateNativeInput"
                    type="date"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    tabIndex={-1}
                    aria-hidden="true"
                    disabled={readOnly}
                />
                <button
                    type="button"
                    className="hrCardAddModal-dateCalendarButton"
                    onClick={openNativePicker}
                    aria-label={calendarLabel}
                    disabled={readOnly}
                >
                    <svg className="hrCardAddModal-dateCalendarIcon" viewBox="0 0 24 24">
                        <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
                        <path d="M7.5 3.5v3" />
                        <path d="M16.5 3.5v3" />
                        <path d="M3.5 9.5h17" />
                    </svg>
                </button>
            </div>
        </>
    );
};

const HrCardUpdateModal = ({
                               isOpen,
                               userId = null,
                               onClose,
                               restrictEditToHrLead = false,
                           }: Props) => {
    const { user } = useAuthStore();
    const [form, setForm] = useState<HrCardFormState>(initialForm);
    const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);

    const usePutHrCard = usePutHrCardHook();
    const updateHrCard = usePutHrCard;
    const {
        data: cardData,
        isPending: isLoading,
        isError,
        mutate: loadHrCardInfo,
        reset: resetHrCardInfo,
    } = useGetHrCardInfo();

    const { data: departmentOptions = [] } = useQuery<Department[]>({
        queryKey: ["departmentOptions"],
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
        queryKey: ["gradeOptions"],
        enabled: isOpen,
        initialData: buildGradeOptions,
        queryFn: async () => buildGradeOptions(),
    });

    const availableDepartments = useMemo(() => {
        return departmentOptions
            .filter(
                (department) =>
                    department.departmentIsUse !== 0 &&
                    department.departmentName?.trim() &&
                    (department.departmentId !== 1 || EXCLUDED_DEPARTMENT_KEYWORDS.length === 0)
            )
            .sort((left, right) => left.departmentName.localeCompare(right.departmentName, "ko"));
    }, [departmentOptions]);

    const availableGrades = useMemo(() => {
        return gradeOptions
            .filter((grade) => grade.gradeName?.trim() && isSelectableGrade(grade.gradeName))
            .map((grade) => ({
                ...grade,
                gradeName: getCanonicalGradeName(grade.gradeName),
            }))
            .sort((left, right) => left.gradeId - right.gradeId);
    }, [gradeOptions]);
    const selectableDepartments = useMemo(
        () => ensureDepartmentOption(availableDepartments, form.departmentId, form.departmentName),
        [availableDepartments, form.departmentId, form.departmentName]
    );
    const selectableGrades = useMemo(
        () => ensureGradeOption(availableGrades, form.gradeId, form.gradeName),
        [availableGrades, form.gradeId, form.gradeName]
    );
    const selectedDepartment = useMemo(
        () => findDepartmentById(selectableDepartments, form.departmentId),
        [selectableDepartments, form.departmentId]
    );
    const resolvedDepartmentName = selectedDepartment?.departmentName ?? form.departmentName;
    const resolvedDepartmentCord = selectedDepartment
        ? getDepartmentCord(selectedDepartment)
        : form.departmentCord;

    const calculatedRole = useMemo(() => {
        return getRoleOption(form.departmentId, resolvedDepartmentName, form.gradeName);
    }, [form.departmentId, resolvedDepartmentName, form.gradeName]);

    const isHrLead = user?.roleId === 2;
    const canEditCard = restrictEditToHrLead
        ? isHrLead
        : isHrLead || !isRestrictedEditGrade(form.gradeName);
    const isReadOnly = updateHrCard.isPending || !canEditCard;
    const inputClassName = isReadOnly
        ? "hrCardAddModal-input hrCardAddModal-input--readonly"
        : "hrCardAddModal-input";
    const textareaClassName = isReadOnly
        ? "hrCardAddModal-textarea hrCardAddModal-input--readonly"
        : "hrCardAddModal-textarea";
    const emailParts = useMemo(() => getEmailParts(form.email), [form.email]);
    const formId = "hr-card-update-form";
    const initialComparableForm = useMemo(
        () =>
            buildComparableFormState(
                cardData ? mapCardToForm(cardData as HrCardWithAccountOwner) : initialForm
            ),
        [cardData]
    );
    const currentComparableForm = useMemo(() => buildComparableFormState(form), [form]);
    const hasUnsavedChanges = hasComparableFormChanges(
        currentComparableForm,
        initialComparableForm
    );

    useEffect(() => {
        if (!isOpen || !userId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            resetHrCardInfo();
            return;
        }

        loadHrCardInfo(userId);
    }, [isOpen, userId, loadHrCardInfo, resetHrCardInfo]);

    useEffect(() => {
        if (!isOpen || !cardData) {
            return;
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm(mapCardToForm(cardData as HrCardWithAccountOwner));
    }, [cardData, isOpen]);

    useEffect(() => {
        if (!selectedDepartment) {
            return;
        }

        const nextDepartmentName = selectedDepartment.departmentName;
        const nextDepartmentCord = getDepartmentCord(selectedDepartment);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm((prev) => {
            if (
                prev.departmentName === nextDepartmentName &&
                prev.departmentCord === nextDepartmentCord
            ) {
                return prev;
            }

            return {
                ...prev,
                departmentName: nextDepartmentName,
                departmentCord: nextDepartmentCord,
            };
        });
    }, [selectedDepartment]);

    useEffect(() => {
        const nextRoleId = calculatedRole ? String(calculatedRole.roleId) : "";

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm((prev) => {
            if (prev.roleId === nextRoleId) {
                return prev;
            }

            return {
                ...prev,
                roleId: nextRoleId,
            };
        });
    }, [calculatedRole]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm((prev) => {
            let nextForm = prev;
            let changed = false;

            if (prev.departmentId && (!prev.departmentName || !prev.departmentCord)) {
                const matchedDepartment = selectableDepartments.find(
                    (department) => String(department.departmentId) === prev.departmentId
                );

                if (matchedDepartment) {
                    nextForm = {
                        ...nextForm,
                        departmentName: prev.departmentName || matchedDepartment.departmentName,
                        departmentCord: prev.departmentCord || getDepartmentCord(matchedDepartment),
                    };
                    changed = true;
                }
            }

            const matchedGradeByName = prev.gradeName
                ? findGradeByName(selectableGrades, prev.gradeName)
                : undefined;

            if (matchedGradeByName) {
                const nextGradeId = String(matchedGradeByName.gradeId);

                if (
                    prev.gradeId !== nextGradeId ||
                    prev.gradeName !== matchedGradeByName.gradeName
                ) {
                    nextForm = {
                        ...nextForm,
                        gradeId: nextGradeId,
                        gradeName: matchedGradeByName.gradeName,
                    };
                    changed = true;
                }
            } else if (!prev.gradeName && prev.gradeId) {
                const matchedGrade = selectableGrades.find(
                    (grade) => String(grade.gradeId) === prev.gradeId
                );

                if (matchedGrade) {
                    nextForm = {
                        ...nextForm,
                        gradeName: matchedGrade.gradeName,
                    };
                    changed = true;
                }
            }

            return changed ? nextForm : prev;
        });
    }, [isOpen, selectableDepartments, selectableGrades]);

    if (!isOpen) {
        return null;
    }

    const handleChange = (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = event.target;

        if (name === "departmentId") {
            const matchedDepartment = findDepartmentById(selectableDepartments, value);

            setForm((prev) => ({
                ...prev,
                departmentId: matchedDepartment ? String(matchedDepartment.departmentId) : "",
                departmentCord: getDepartmentCord(matchedDepartment),
                departmentName: matchedDepartment?.departmentName ?? "",
            }));
            return;
        }

        if (name === "gradeName") {
            const matchedGrade = findGradeByName(selectableGrades, value);

            setForm((prev) => ({
                ...prev,
                gradeName: matchedGrade?.gradeName ?? value,
                gradeId: matchedGrade ? String(matchedGrade.gradeId) : "",
            }));
            return;
        }

        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSearchAddress = async () => {
        if (isReadOnly) {
            return;
        }

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

    const handleCancelEdit = () => {
        setIsExitConfirmOpen(false);
        setForm(cardData ? mapCardToForm(cardData as HrCardWithAccountOwner) : initialForm);

        onClose();
    };

    const handleCloseAttempt = () => {
        if (updateHrCard.isPending) {
            return;
        }

        if (hasUnsavedChanges) {
            setIsExitConfirmOpen(true);
            return;
        }

        handleCancelEdit();
    };

    const updateEmail = (nextLocal: string, nextDomain: string) => {
        setForm((prev) => ({
            ...prev,
            email: formatEmailValue(nextLocal, nextDomain),
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!userId) {
            return;
        }

        if (!canEditCard) {
            alert(
                restrictEditToHrLead
                    ? "퇴사자 카드는 인사팀 팀장만 수정할 수 있습니다."
                    : "부장급 이상 인사카드는 인사팀 팀장만 수정할 수 있습니다."
            );
            return;
        }

        try {
            validateHrCardDates({
                birth: form.birth.trim(),
                startDate: form.startDate.trim(),
                quitDate: form.quitDate.trim(),
            });

            const request: HrCardMutationPayload  = {
                employeeId: form.employeeId.trim(),
                userName: form.userName.trim(),
                password: form.password.trim() || undefined,
                birth: toNullable(form.birth),
                startDate: form.startDate.trim() || undefined,
                quitDate: toNullable(form.quitDate),
                roleId: form.roleId ? Number(form.roleId) : undefined,
                departmentId: form.departmentId ? Number(form.departmentId) : undefined,
                departmentName: toNullable(form.departmentName),
                gradeId: form.gradeId ? Number(form.gradeId) : undefined,
                gradeName: toNullable(form.gradeName),
                email: toNullable(form.email),
                phone: toNullable(form.phone),
                bank: toNullable(form.bank),
                accountOwner: toNullable(form.accountOwner),
                accountNum: toNullable(form.accountNum),
                address: toNullable(form.address),
                performance: toNullable(form.performance),
            };

            await updateHrCard.mutateAsync({
                userId,
                payload: request,
            });

            handleCancelEdit();
            alert("인사카드를 수정했습니다.");
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "인사카드 수정 중 오류가 발생했습니다.";

            console.error(error);
            alert(message);
        }
    };

    const footer =
        !isLoading && !isError && userId && cardData ? (
            <div className="btn-Wrap">
                <button
                    type="submit"
                    form={formId}
                    className="btn-Primary"
                    disabled={updateHrCard.isPending || !canEditCard}
                >
                    { usePutHrCard.isPending ? "저장 중..." : "저장"}
                </button>
                <button
                    type="button"
                    className="btn-Secondary"
                    onClick={handleCloseAttempt}
                    disabled={updateHrCard.isPending}
                >
                    취소
                </button>
            </div>
        ) : undefined;

    return (
        <>
            <Modal
                title="인사카드 수정"
                isOpen={isOpen}
                onClose={handleCloseAttempt}
                footer={footer}
            >
                {isLoading ? (
                        <div className="hrCardAddModal-form">
                            <div className="hrCardAddModal-row">기존 정보를 불러오는 중입니다.</div>
                        </div>
                    ) : isError ? (
                        <div className="hrCardAddModal-form">
                            <div className="hrCardAddModal-row">인사카드 정보를 불러오지 못했습니다.</div>
                        </div>
                    ) : !userId || !cardData ? (
                        <div className="hrCardAddModal-form">
                            <div className="hrCardAddModal-row">선택한 인사카드가 없습니다.</div>
                        </div>
                    ) : (
                        <>
                            <form id={formId}  onSubmit={handleSubmit}>
                                <div className="modal-Row">
                                    <div className="modal-Row-Group">
                                        <div className="modal-Row-Item">
                                            <label>사번번호</label>
                                            <input
                                                name="employeeId"
                                                value={form.employeeId}
                                                onChange={handleChange}
                                                readOnly={isReadOnly}
                                            />
                                        </div>
                                        <div className="modal-Row-Item">
                                            <label>이름</label>
                                            <input
                                                name="userName"
                                                value={form.userName}
                                                onChange={handleChange}
                                                readOnly={isReadOnly}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-Row">
                                    <div className="modal-Row-Group">
                                        <div className="modal-Row-Item">
                                            <label>직급/직책</label>
                                            <select
                                                name="gradeName"
                                                value={form.gradeName}
                                                onChange={handleChange}
                                                disabled={isReadOnly}
                                            >
                                                <option value="">직급을 선택하세요</option>
                                                {selectableGrades.map((grade) => (
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
                                                value={form.gradeId}
                                                readOnly
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
                                                disabled={isReadOnly}
                                            >
                                                <option value="">부서를 선택하세요</option>
                                                {selectableDepartments.map((department) => (
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
                                                value={form.roleId}
                                                readOnly
                                                title="부서와 직급을 선택하면 자동으로 계산됩니다."
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-Row">
                                    <div className="modal-Row-Group">
                                        <div className="modal-Row-Item">
                                            <label >부서 코드</label>
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
                                                type="password"
                                                value={form.password}
                                                onChange={handleChange}
                                                readOnly={isReadOnly}
                                                placeholder="변경 시에만 입력"
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
                                            readOnly={isReadOnly}
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
                                            readOnly={isReadOnly}
                                            placeholder="domain.com"
                                            inputMode="email"
                                        />
                                    </div>
                                </div>

                                <div className="modal-Row">
                                    <label>생년월일</label>
                                    <DateInputWithPicker
                                        value={form.birth}
                                        onChange={(value) => setForm((prev) => ({ ...prev, birth: value }))}
                                        readOnly={isReadOnly}
                                        calendarLabel="생년월일 선택"
                                    />
                                </div>
                                <div className="modal-Row">
                                    <label>입사일</label>
                                    <DateInputWithPicker
                                        value={form.startDate}
                                        onChange={(value) => setForm((prev) => ({ ...prev, startDate: value }))}
                                        readOnly={isReadOnly}
                                        calendarLabel="입사일 선택"
                                    />
                                </div>
                                <div className="modal-Row">
                                    <label>퇴사일</label>
                                    <DateInputWithPicker
                                        value={form.quitDate}
                                        onChange={(value) => setForm((prev) => ({ ...prev, quitDate: value }))}
                                        readOnly={isReadOnly}
                                        calendarLabel="퇴사일 선택"
                                    />
                                </div>
                                <div className="modal-Row">
                                    <label>연락처</label>
                                    <input
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        readOnly={isReadOnly}
                                    />
                                </div>
                                <div className="modal-Row">
                                    <div className="modal-Row-Group">
                                        <div className="modal-Row-Item">
                                            <label>은행</label>
                                            <input
                                                name="bank"
                                                value={form.bank}
                                                onChange={handleChange}
                                                readOnly={isReadOnly}
                                            />
                                        </div>

                                        <div className="modal-Row-Item">
                                            <label >계좌번호</label>
                                            <input
                                                name="accountNum"
                                                value={form.accountNum}
                                                onChange={handleChange}
                                                readOnly={isReadOnly}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-Row" style={{gap:"3px"}}>
                                    <label>주소</label>
                                        <input
                                            name="address"
                                            className={inputClassName}
                                            value={form.address}
                                            onChange={handleChange}
                                            readOnly={isReadOnly}
                                        />
                                        <button
                                            type="button"
                                            style={{whiteSpace:"nowrap"}}
                                            className="btn-Secondary"
                                            onClick={handleSearchAddress}
                                            disabled={isReadOnly}
                                        >
                                            주소검색
                                        </button>
                                    </div>
                                    <div className="modal-Row">
                                        <label>인사평가</label>
                                        <textarea
                                            name="performance"
                                            className={textareaClassName}
                                            value={form.performance}
                                            onChange={handleChange}
                                            readOnly={isReadOnly}
                                            rows={3}
                                        />
                                    </div>
                                </form>
                             </>
                    )}
            </Modal>
            <ConfirmModal
                isOpen={isExitConfirmOpen}
                message="수정 중인 내용이 있습니다. 나가시겠습니까?"
                onConfirm={handleCancelEdit}
                onClose={() => setIsExitConfirmOpen(false)}
            />
        </>
    );
};

export default HrCardUpdateModal;
