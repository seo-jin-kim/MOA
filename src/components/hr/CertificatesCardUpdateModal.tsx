import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
    type CertificatesCardRecord,
    useGetCertificatesCardInfo,
    usePostCertificatesCard as usePostCertificatesCardHook,
    usePutCertificatesCard as usePutCertificatesCardHook,
} from "../../apis/hr/CertificatesCardService";
import LeaverCertificateModal from "./CertificateDocumentModal.tsx";
import ConfirmModal from "../ConfirmModal";
import Modal from "../Modal";
import "../../assets/styles/hr/certificatesUpdateCardModal.css";
import {
    createHrGradeOptions,
    getHrGradeNameById,
    resolveHrGradeId,
} from "../../constants/hrGradeOptions";
import { useAuthStore } from "../../stores/useAuthStore";

type Props = {
    isOpen: boolean;
    userId?: number | null;
    onClose: () => void;
    restrictEditToHrLead?: boolean;
};

type Department = {
    departmentId: number;
    departmentCord?: string | null;
    departmentName: string;
    departmentIsUse?: number | null;
};

type DepartmentResponse = Department[] | { content?: Department[]; value?: Department[] };

type GradeOption = {
    gradeId: number;
    gradeName: string;
};

type CardDetail = CertificatesCardRecord & Record<string, unknown>;

type FormState = {
    employeeId: string;
    userName: string;
    roleId: string;
    departmentId: string;
    departmentName: string;
    departmentCord: string;
    gradeId: string;
    gradeName: string;
    email: string;
    phone: string;
    address: string;
};

type DepartmentKey = "HR" | "WML" | "ACLE";
type GradeGroup = "EXECUTIVE" | "LEAD" | "STAFF";
type RoleOption = { roleId: number; code: string; label: string };

const DEPARTMENT_API_BASE = "/api/base/dept";
const EXCLUDED_DEPARTMENT_KEYWORDS = ["이사회"];
const MIN_VISIBLE_GRADE_ID = 5;

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

const initialForm: FormState = {
    employeeId: "",
    userName: "",
    roleId: "",
    departmentId: "",
    departmentName: "",
    departmentCord: "",
    gradeId: "",
    gradeName: "",
    email: "",
    phone: "",
    address: "",
};

const normalizeText = (value: string) => value.trim().replace(/\s+/g, "").toLowerCase();

const getStringField = (record: Record<string, unknown>, ...keys: string[]) => {
    for (const key of keys) {
        const value = record[key];

        if (typeof value === "string" && value.trim() !== "") {
            return value.trim();
        }

        if (typeof value === "number") {
            return String(value);
        }
    }

    return "";
};

const getNumberField = (record: Record<string, unknown>, ...keys: string[]) => {
    for (const key of keys) {
        const value = record[key];

        if (typeof value === "number" && Number.isFinite(value)) {
            return value;
        }

        if (typeof value === "string" && value.trim() !== "") {
            const parsed = Number(value);

            if (Number.isFinite(parsed)) {
                return parsed;
            }
        }
    }

    return undefined;
};

const extractDepartments = (response: DepartmentResponse) =>
    Array.isArray(response) ? response : response.content ?? response.value ?? [];

const isVisibleDepartment = (department: Department) => {
    if (department.departmentIsUse === 0) {
        return false;
    }

    const normalizedName = normalizeText(department.departmentName);

    return !EXCLUDED_DEPARTMENT_KEYWORDS.some((keyword) =>
        normalizedName.includes(normalizeText(keyword))
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

const findDepartmentById = (departments: Department[], departmentId: string) =>
    departments.find((department) => String(department.departmentId) === departmentId.trim());

const findGradeById = (grades: GradeOption[], gradeId: string) =>
    grades.find((grade) => String(grade.gradeId) === gradeId.trim());

const isVisibleGradeOption = (grade: GradeOption) => grade.gradeId >= MIN_VISIBLE_GRADE_ID;

const getDepartmentKey = (
    departmentId: string,
    departmentName: string
): DepartmentKey | undefined => {
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

    return Number.isFinite(parsedDepartmentId)
        ? DEPARTMENT_KEY_BY_ID[parsedDepartmentId]
        : undefined;
};

const getGradeGroup = (gradeName: string): GradeGroup | undefined => {
    const normalizedGrade = normalizeText(gradeName);

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
    departmentId: string,
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

    return departmentKey ? ROLE_OPTIONS[`${departmentKey}:${gradeGroup}`] : undefined;
};

const ensureDepartmentOption = (
    departments: Department[],
    departmentId: string,
    departmentName: string,
    departmentCord: string
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

    const parsedDepartmentId = Number(departmentId);

    return [
        ...departments,
        {
            departmentId: Number.isFinite(parsedDepartmentId) ? parsedDepartmentId : -1,
            departmentCord: departmentCord || undefined,
            departmentName: trimmedDepartmentName,
            departmentIsUse: 1,
        },
    ];
};

const ensureGradeOption = (grades: GradeOption[], gradeId: string, gradeName: string) => {
    const trimmedGradeName = gradeName.trim();
    const parsedGradeId = Number(gradeId);

    if (
        !trimmedGradeName ||
        !Number.isFinite(parsedGradeId) ||
        parsedGradeId < MIN_VISIBLE_GRADE_ID
    ) {
        return grades;
    }

    const hasCurrentGrade = grades.some(
        (grade) =>
            String(grade.gradeId) === gradeId ||
            normalizeText(grade.gradeName) === normalizeText(trimmedGradeName)
    );

    if (hasCurrentGrade) {
        return grades;
    }

    return [
        ...grades,
        {
            gradeId: Number.isFinite(parsedGradeId) ? parsedGradeId : -1,
            gradeName: trimmedGradeName,
        },
    ].sort((left, right) => left.gradeId - right.gradeId);
};

const mapCardToForm = (card: CardDetail): FormState => {
    const resolvedGradeId = resolveHrGradeId(getNumberField(card, "gradeId", "grade_id"));
    const gradeName =
        getStringField(card, "gradeName", "grade_name") ||
        getHrGradeNameById(resolvedGradeId);

    return {
        employeeId: getStringField(card, "employeeId", "employee_id"),
        userName: getStringField(card, "userName", "user_name"),
        roleId: getStringField(card, "roleId", "role_id"),
        departmentId: getStringField(card, "departmentId", "department_id"),
        departmentName: getStringField(card, "departmentName", "department_name"),
        departmentCord: getStringField(card, "departmentCord", "department_cord"),
        gradeId: resolvedGradeId ? String(resolvedGradeId) : "",
        gradeName,
        email: getStringField(card, "email"),
        phone: getStringField(card, "phone"),
        address: getStringField(card, "address"),
    };
};

const formatDepartmentDisplay = (departmentName: string, departmentCord: string) => {
    if (!departmentName) {
        return departmentCord;
    }

    if (!departmentCord) {
        return departmentName;
    }

    return `${departmentName} (${departmentCord})`;
};

const formatGradeDisplay = (gradeName: string, gradeId: string) => {
    if (!gradeName) {
        return gradeId;
    }

    if (!gradeId) {
        return gradeName;
    }

    return `${gradeName} (${gradeId})`;
};

const getCertificatePreviewData = (
    cardDetail: CardDetail | null,
    form: FormState,
    departmentName: string,
    departmentCord: string,
    gradeName: string
) => {
    if (!cardDetail || !form.employeeId.trim() || !form.userName.trim()) {
        return null;
    }

    return {
        userName: form.userName.trim(),
        employeeId: form.employeeId.trim(),
        departmentName: departmentName.trim(),
        departmentCord: departmentCord.trim(),
        gradeName: gradeName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        birth: getStringField(cardDetail, "birth"),
        startDate: getStringField(cardDetail, "startDate", "start_date"),
        quitDate: getStringField(cardDetail, "quitDate", "quit_date"),
    };
};

const buildPayload = (form: FormState) => ({
    employeeId: form.employeeId.trim(),
    userName: form.userName.trim(),
    roleId: Number(form.roleId),
    departmentId: Number(form.departmentId),
    departmentName: form.departmentName.trim(),
    departmentCord: form.departmentCord.trim(),
    gradeId: Number(form.gradeId),
    gradeName: form.gradeName.trim(),
});

const areSameForm = (left: FormState, right: FormState) =>
    JSON.stringify(left) === JSON.stringify(right);

const CertificatesCardUpdateModal = ({
                                         isOpen,
                                         userId,
                                         onClose,
                                         restrictEditToHrLead = false,
                                     }: Props) => {
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);
    const isCreateMode = userId === null || userId === undefined;
    const formId = "certificates-card-update-form";

    const [departments, setDepartments] = useState<Department[]>([]);
    const [form, setForm] = useState<FormState>(initialForm);
    const [initialSnapshot, setInitialSnapshot] = useState<FormState>(initialForm);
    const [cardDetail, setCardDetail] = useState<CardDetail | null>(null);
    const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [departmentError, setDepartmentError] = useState("");
    const [loadError, setLoadError] = useState("");
    const [saveError, setSaveError] = useState("");
    const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
    const [isCareerCertificateOpen, setIsCareerCertificateOpen] = useState(false);

    const { mutateAsync: fetchCertificatesCardInfo } = useGetCertificatesCardInfo();
    const postCertificatesCard = usePostCertificatesCardHook();
    const putCertificatesCard = usePutCertificatesCardHook();

    const isSaving = postCertificatesCard.isPending || putCertificatesCard.isPending;
    const canEdit = !restrictEditToHrLead || user?.roleId === 2;


    const selectableDepartments = useMemo(
        () =>
            ensureDepartmentOption(
                departments,
                form.departmentId,
                form.departmentName,
                form.departmentCord
            ),
        [departments, form.departmentId, form.departmentName, form.departmentCord]
    );

    const selectableGrades = useMemo(
        () =>
            ensureGradeOption(
                createHrGradeOptions().filter(isVisibleGradeOption),
                form.gradeId,
                form.gradeName
            ),
        [form.gradeId, form.gradeName]
    );

    const selectedDepartment = useMemo(
        () => findDepartmentById(selectableDepartments, form.departmentId),
        [selectableDepartments, form.departmentId]
    );

    const selectedGrade = useMemo(
        () => findGradeById(selectableGrades, form.gradeId),
        [selectableGrades, form.gradeId]
    );

    const resolvedDepartmentName = selectedDepartment?.departmentName ?? form.departmentName;

    const resolvedDepartmentCord = selectedDepartment
        ? getDepartmentCord(selectedDepartment)
        : form.departmentCord;

    const resolvedGradeName = selectedGrade?.gradeName ?? form.gradeName;

    const resolvedGradeId = selectedGrade ? String(selectedGrade.gradeId) : form.gradeId;

    const calculatedRole = useMemo(() => {
        return getRoleOption(form.departmentId, resolvedDepartmentName, resolvedGradeName);
    }, [form.departmentId, resolvedDepartmentName, resolvedGradeName]);

    const originalDepartmentDisplay = useMemo(() => {
        if (isCreateMode) {
            return "";
        }

        const originalDepartment = findDepartmentById(
            selectableDepartments,
            initialSnapshot.departmentId
        );

        return formatDepartmentDisplay(
            initialSnapshot.departmentName || (originalDepartment?.departmentName ?? ""),
            initialSnapshot.departmentCord || getDepartmentCord(originalDepartment)
        );
    }, [
        initialSnapshot.departmentCord,
        initialSnapshot.departmentId,
        initialSnapshot.departmentName,
        isCreateMode,
        selectableDepartments,
    ]);

    const originalGradeDisplay = useMemo(() => {
        if (isCreateMode) {
            return "";
        }

        const originalGrade = findGradeById(selectableGrades, initialSnapshot.gradeId);

        return formatGradeDisplay(
            initialSnapshot.gradeName || (originalGrade?.gradeName ?? ""),
            initialSnapshot.gradeId
        );
    }, [
        initialSnapshot.gradeId,
        initialSnapshot.gradeName,
        isCreateMode,
        selectableGrades,
    ]);

    const hasReferenceInfo = Boolean(form.email || form.phone || form.address);

    const careerCertificateData = useMemo(
        () =>
            getCertificatePreviewData(
                cardDetail,
                form,
                resolvedDepartmentName,
                resolvedDepartmentCord,
                resolvedGradeName
            ),
        [cardDetail, form, resolvedDepartmentCord, resolvedDepartmentName, resolvedGradeName]
    );

    const hasUnsavedChanges = useMemo(
        () => !areSameForm(form, initialSnapshot),
        [form, initialSnapshot]
    );

    const noticeMessage = useMemo(() => {
        const messages: string[] = [];

        if (isLoadingDetail) {
            messages.push("인사 발령 정보를 불러오는 중입니다.");
        }

        if (isLoadingDepartments) {
            messages.push("부서 목록을 불러오는 중입니다.");
        }

        if (departmentError) {
            messages.push(departmentError);
        }

        if (loadError) {
            messages.push(loadError);
        }

        if (saveError) {
            messages.push(saveError);
        }

        if (!canEdit) {
            messages.push("현재 계정은 이 발령을 저장할 수 없습니다.");
        }

        return messages.join(" ");
    }, [canEdit, departmentError, isLoadingDepartments, isLoadingDetail, loadError, saveError]);

    const resetModalState = () => {
        setDepartments([]);
        setForm(initialForm);
        setInitialSnapshot(initialForm);
        setCardDetail(null);
        setIsLoadingDepartments(false);
        setIsLoadingDetail(false);
        setDepartmentError("");
        setLoadError("");
        setSaveError("");
        setIsExitConfirmOpen(false);
        setIsCareerCertificateOpen(false);
    };

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        let isCancelled = false;

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsLoadingDepartments(true);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDepartmentError("");

        axios
            .get<DepartmentResponse>(DEPARTMENT_API_BASE, { withCredentials: true })
            .then(({ data }) => {
                if (isCancelled) {
                    return;
                }

                const nextDepartments = extractDepartments(data)
                    .filter(isVisibleDepartment)
                    .sort((left, right) =>
                        left.departmentName.localeCompare(right.departmentName, "ko")
                    );

                setDepartments(nextDepartments);
            })
            .catch(() => {
                if (isCancelled) {
                    return;
                }

                setDepartments([]);
                setDepartmentError("부서 목록을 불러오지 못했습니다.");
            })
            .finally(() => {
                if (!isCancelled) {
                    setIsLoadingDepartments(false);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        if (isCreateMode) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setForm(initialForm);
            setInitialSnapshot(initialForm);
            setCardDetail(null);
            setLoadError("");
            return;
        }

        let isCancelled = false;

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsLoadingDetail(true);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoadError("");

        fetchCertificatesCardInfo(userId)
            .then((card) => {
                if (isCancelled) {
                    return;
                }

                const nextForm = mapCardToForm(card as CardDetail);
                setCardDetail(card as CardDetail);
                setForm(nextForm);
                setInitialSnapshot(nextForm);
            })
            .catch(() => {
                if (isCancelled) {
                    return;
                }

                setForm(initialForm);
                setInitialSnapshot(initialForm);
                setCardDetail(null);
                setLoadError("인사 발령 정보를 불러오지 못했습니다.");
            })
            .finally(() => {
                if (!isCancelled) {
                    setIsLoadingDetail(false);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [fetchCertificatesCardInfo, isCreateMode, isOpen, userId]);

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
        if (!selectedGrade) {
            return;
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm((prev) => {
            if (prev.gradeName === selectedGrade.gradeName) {
                return prev;
            }

            return {
                ...prev,
                gradeName: selectedGrade.gradeName,
            };
        });
    }, [selectedGrade]);

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

    if (!isOpen) {
        return null;
    }

    const handleChange = (
        event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = event.target;

        setSaveError("");

        if (name === "employeeId" || name === "userName" || name === "roleId") {
            return;
        }

        if (name === "departmentId") {
            const department = findDepartmentById(selectableDepartments, value);

            setForm((prev) => ({
                ...prev,
                departmentId: value,
                departmentName: department?.departmentName ?? "",
                departmentCord: getDepartmentCord(department),
            }));
            return;
        }

        if (name === "gradeId") {
            const grade = findGradeById(selectableGrades, value);

            setForm((prev) => ({
                ...prev,
                gradeId: value,
                gradeName: grade?.gradeName ?? "",
            }));
            return;
        }

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleRequestClose = () => {
        if (hasUnsavedChanges && !isSaving) {
            setIsExitConfirmOpen(true);
            return;
        }

        resetModalState();
        onClose();
    };

    const validateForm = () => {
        if (!form.employeeId.trim() || !form.userName.trim()) {
            return "사번과 이름은 필수입니다.";
        }

        if (!form.roleId || !Number.isFinite(Number(form.roleId))) {
            return "권한을 계산하지 못했습니다. 부서와 직급을 다시 선택해 주세요.";
        }

        if (!resolvedDepartmentName || !resolvedDepartmentCord || !form.departmentId) {
            return "부서를 선택해 주세요.";
        }

        if (!resolvedGradeName || !resolvedGradeId || !form.gradeId) {
            return "직급을 선택해 주세요.";
        }

        if (!Number.isFinite(Number(form.departmentId)) || !Number.isFinite(Number(form.gradeId))) {
            return "부서와 직급 정보를 다시 확인해 주세요.";
        }

        return "";
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!canEdit) {
            return;
        }

        const validationMessage = validateForm();

        if (validationMessage) {
            setSaveError(validationMessage);
            return;
        }

        const payload = buildPayload({
            ...form,
            roleId: calculatedRole ? String(calculatedRole.roleId) : form.roleId,
            departmentName: resolvedDepartmentName,
            departmentCord: resolvedDepartmentCord,
            gradeId: resolvedGradeId,
            gradeName: resolvedGradeName,
        });

        try {
            if (isCreateMode) {
                await postCertificatesCard.mutateAsync(payload);
            } else if (userId !== null && userId !== undefined) {
                await putCertificatesCard.mutateAsync({
                    userId,
                    payload,
                });
            }

            await queryClient.invalidateQueries({
                queryKey: ["certificatesCardList"],
                exact: false,
            });

            await queryClient.invalidateQueries({
                queryKey: ["hrCards"],
                exact: false,
            });

            await queryClient.invalidateQueries({
                queryKey: ["hrCardList"],
                exact: false,
            });

            resetModalState();
            onClose();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.log("발령 저장 실패 상태:", error.response?.status);
                console.log("발령 저장 실패 응답:", error.response?.data);
                console.log("발령 저장 요청 payload:", payload);
            }

            setSaveError(
                isCreateMode
                    ? "인사 발령을 등록하지 못했습니다."
                    : "인사 발령을 저장하지 못했습니다."
            );
        }
    };

    const submitLabel = isSaving
        ? isCreateMode
            ? "등록 중..."
            : "저장 중..."
        : isCreateMode
            ? "발령 등록"
            : "발령 저장";

    return (
        <>
                <Modal
                    title={isCreateMode ? "인사 발령 등록" : "인사 발령 수정"}
                    isOpen={isOpen}
                    onClose={handleRequestClose}
                    footer={
                        <div className="btn-Wrap">
                            <button
                                type="submit"
                                form={formId}
                                className="btn-Primary"
                                disabled={isSaving || !canEdit}
                            >
                                {submitLabel}
                            </button>
                            <button
                                type="button"
                                className="btn-Secondary"
                                onClick={handleRequestClose}
                                disabled={isSaving}
                            >
                                취소
                            </button>
                        </div>
                    }
                >
                    <form
                        id={formId}
                        onSubmit={handleSubmit}
                    >
                        <div className="modal-Row">
                            <div className="modal-Row-Group">
                                <div className="modal-Row-Item">
                                    <label
                                        htmlFor="certificates-employeeId"
                                    >
                                        사번
                                    </label>
                                    <input
                                        id="certificates-employeeId"
                                        name="employeeId"
                                        value={form.employeeId}
                                        onChange={handleChange}
                                        readOnly
                                    />
                                </div>
                                <div className="modal-Row-Item">
                                    <label
                                        htmlFor="certificates-userName"
                                    >
                                        이름
                                    </label>
                                    <input
                                        id="certificates-userName"
                                        name="userName"
                                        value={form.userName}
                                        onChange={handleChange}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>
                        {!isCreateMode && (
                        <div className="modal-Row">
                            <div className="modal-Row-Group">
                                <div className="modal-Row-Item">
                                    <label>
                                        원래 부서
                                    </label>
                                    <input
                                        value={originalDepartmentDisplay}
                                        readOnly
                                    />
                                </div>
                                <div className="modal-Row-Item">
                                    <label>
                                        원래 직급
                                    </label>
                                    <input
                                        value={originalGradeDisplay}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>
                            )}
                        <div className="modal-Row">
                            <div className="modal-Row-Group">
                                <div className="modal-Row-Item">
                                    <label
                                        htmlFor="certificates-departmentId"
                                    >
                                        발령 부서
                                    </label>
                                    <select
                                        id="certificates-departmentId"
                                        name="departmentId"
                                        value={form.departmentId}
                                        onChange={handleChange}
                                        disabled={isSaving || !canEdit || isLoadingDepartments}
                                    >
                                        <option value="">부서를 선택하세요</option>

                                        {selectableDepartments.map((department) => (
                                            <option
                                                key={department.departmentId}
                                                value={department.departmentId}
                                            >
                                                {department.departmentName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="modal-Row-Item">
                                    <label>
                                        부서코드
                                    </label>
                                    <input
                                        value={resolvedDepartmentCord}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-Row">
                            <div className="modal-Row-Group">
                                <div className="modal-Row-Item">
                                    <label
                                        htmlFor="certificates-gradeId"
                                    >
                                        발령 직급
                                    </label>
                                    <select
                                        id="certificates-gradeId"
                                        name="gradeId"
                                        value={form.gradeId}
                                        onChange={handleChange}
                                        disabled={isSaving || !canEdit}
                                    >
                                        <option value="">직급을 선택하세요</option>

                                        {selectableGrades.map((grade) => (
                                            <option key={grade.gradeId} value={grade.gradeId}>
                                                {grade.gradeName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="modal-Row-Item">
                                    <label>
                                        직급코드
                                    </label>
                                    <input
                                        value={resolvedGradeId}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>
                            <div className="modal-Row">
                                <label
                                    htmlFor="certificates-roleId"
                                >
                                    권한
                                </label>
                                <input
                                    id="certificates-roleId"
                                    name="roleId"
                                    value={
                                        calculatedRole
                                            ? `${calculatedRole.roleId} / ${calculatedRole.label}`
                                            : form.roleId
                                    }
                                    readOnly
                                    title="부서와 직급을 선택하면 자동으로 계산됩니다."
                                />
                            </div>
                            {hasReferenceInfo && (
                                <>
                                    <div className="modal-Row">
                                            <label>
                                                이메일
                                            </label>
                                            <input
                                                value={form.email}
                                                readOnly
                                            />
                                    </div>

                                    <div className="modal-Row">
                                        <label>
                                            연락처
                                        </label>
                                        <input
                                            value={form.phone}
                                            readOnly
                                        />
                                    </div>
                                    <div className="modal-Row">
                                        <label>
                                            주소
                                        </label>
                                        <input
                                            value={form.address}
                                            readOnly
                                        />
                                     </div>
                                 </>
                        )}

                        {noticeMessage && (
                            <div className="certificatesCardAddModal-row">
                                <div className="certificatesCardAddModal-column">
                                    <label className="certificatesCardAddModal-label">
                                        안내
                                    </label>
                                    <div className="certificatesCardAddModal-hint">
                                        {noticeMessage}
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </Modal>

            <ConfirmModal
                isOpen={isExitConfirmOpen}
                message="작성 중인 내용이 있습니다. 닫으시겠습니까?"
                onConfirm={() => {
                    resetModalState();
                    onClose();
                }}
                onClose={() => setIsExitConfirmOpen(false)}
            />

            <LeaverCertificateModal
                isOpen={isCareerCertificateOpen}
                onClose={() => setIsCareerCertificateOpen(false)}
                data={careerCertificateData}
            />
        </>
    );
};

export default CertificatesCardUpdateModal;
