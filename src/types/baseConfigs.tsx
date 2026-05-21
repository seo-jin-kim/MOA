const renderUseStatus = (val: any) => {
    // 값이 없거나 null이면 기본값 0으로 처리
    const status = (val === undefined || val === null) ? 0 : Number(val);
    return status === 1 ? "사용" : "미사용";
};

export const baseConfigs = {
    adminRole: {
        title: "권한등록",
        apiUrl: "/api/base/role",
        idKey: "adminId",
        // 표(Table)에 보여줄 컬럼들
        columns: [
            { key: "cord", label: "권한코드" },
            { key: "name", label: "권한명" },
            { key: "isUse", label: "사용여부",align:"center"}
        ],
        // 등록/수정 모달(Modal)에 나타날 입력창들
        fields: [
            { key: "cord", label: "권한코드", type: "text" },
            { key: "name", label: "권한명", type: "text" },
            {
                key: "isUse",
                label: "사용여부",
                type: "select",
                options: [{ label: "사용", value: 1 }, { label: "미사용", value: 0 }],
                render: renderUseStatus
            }
        ]
    },
    allowance: {
        title: "수당항목등록",
        apiUrl: "/api/base/allow",
        idKey: "allowanceId",
        // 표(Table)에 보여줄 컬럼들
        columns: [
            { key: "allowanceCord", label: "수당코드" },
            { key: "allowanceName", label: "수당명" },
            { key: "allowanceIsUse", label: "사용여부",align:"center" }
        ],
        // 등록/수정 모달(Modal)에 나타날 입력창들
        fields: [
            { key: "allowanceCord", label: "수당코드", type: "text" },
            { key: "allowanceName", label: "수당명", type: "text" },
            {
                key: "allowanceIsUse",
                label: "사용여부",
                align:"center",
                type: "select",
                options: [{ label: "사용", value: 1 }, { label: "미사용", value: 0 }],
                render: renderUseStatus
            }
        ]
    },
    approvalLine: {
        title: "결재라인",
        apiUrl: "/api/base/approval",
        idKey: "approvalLineId",
        // 표(Table)에 보여줄 컬럼들
        columns: [
            { key: "approvalLineCord", label: "결재라인코드" },
            { key: "approvalLineName", label: "결재라인명" },
            { key: "approvalLineIsUse", label: "사용여부", render: renderUseStatus }
        ],
        // 등록/수정 모달(Modal)에 나타날 입력창들
        fields: [
            { key: "approvalLineCord", label: "결재라인코드", type: "text" },
            { key: "approvalLineName", label: "결재라인명", type: "text" },
            {
                key: "approvalLineIsUse",
                label: "사용여부",
                align:"center",
                type: "select",
                options: [{ label: "사용", value: 1 }, { label: "미사용", value: 0 }],
                render: renderUseStatus
            }
        ]
    },
    companyAccount: {
        title: "계좌등록",
        apiUrl: "/api/base/account",
        idKey: "companyAccountId",
        // 표(Table)에 보여줄 컬럼들
        columns: [
            { key: "companyAccountCord", label: "계좌코드" },
            { key: "companyAccountName", label: "계좌명" },
            { key: "companyAccountBank", label: "은행명" },
            { key: "companyAccountNum", label: "계좌번호" },
            { key: "companyAccountIsUse", label: "사용여부",align:"center" }
        ],
        // 등록/수정 모달(Modal)에 나타날 입력창들
        fields: [
            { key: "companyAccountCord", label: "계좌코드", type: "text" },
            { key: "companyAccountName", label: "계좌명", type: "text" },
            { key: "companyAccountBank", label: "은행명", type: "text" },
            { key: "companyAccountNum", label: "계좌번호", type: "text" },
            {
                key: "companyAccountIsUse",
                label: "사용여부",
                align:"center",
                type: "select",
                options: [{ label: "사용", value: 1 }, { label: "미사용", value: 0 }],
                render: renderUseStatus
            }
        ]
    },
    department: {
        title: "부서등록 ",
        apiUrl: "/api/base/dept",
        idKey: "departmentId",
        // 표(Table)에 보여줄 컬럼들
        columns: [
            { key: "departmentCord", label: "부서코드" },
            { key: "departmentName", label: "부서명" },
            { key: "departmentIsUse", label: "사용여부",align:"center" }
        ],
        // 등록/수정 모달(Modal)에 나타날 입력창들
        fields: [
            { key: "departmentCord", label: "부서코드", type: "text" },
            { key: "departmentName", label: "부서명", type: "text" },
            {
                key: "departmentIsUse",
                label: "사용여부",
                align:"center",
                type: "select",
                options: [{ label: "사용", value: 1 }, { label: "미사용", value: 0 }],
                render: renderUseStatus
            }
        ]
    },
    document: {
        title: "공통양식",
        apiUrl: "/api/base/form",
        idKey: "documentId",
        // 표(Table)에 보여줄 컬럼들
        columns: [
            { key: "documentCord", label: "양식코드" },
            { key: "documentName", label: "양식명" },
            { key: "documentIsUse", label: "사용여부",align:"center" }
        ],
        // 등록/수정 모달(Modal)에 나타날 입력창들
        fields: [
            { key: "documentCord", label: "양식코드", type: "text" },
            { key: "documentName", label: "양식명", type: "text" },
            {
                key: "documentIsUse",
                label: "사용여부",
                align:"center",
                type: "select",
                options: [{ label: "사용", value: 1 }, { label: "미사용", value: 0 }],
                render: renderUseStatus
            }
        ]
    },
    product: {
        title: "품목등록",
        apiUrl: "/api/base/item",
        idKey: "productId",
        // 표(Table)에 보여줄 컬럼들
        columns: [
            { key: "productCord", label: "품목코드" },
            { key: "productName", label: "품목명" },
            { key: "productCategory", label: "카테고리" },
            { key: "productPrice", label: "단가" },
            { key: "productIsUse", label: "사용여부",align:"center" }
        ],
        // 등록/수정 모달(Modal)에 나타날 입력창들
        fields: [
            { key: "productCord", label: "품목코드", type: "text" },
            { key: "productName", label: "품목명", type: "text" },
            { key: "productCategory", label: "카테고리", type:"text" },
            { key: "productPrice", label: "단가", type:"number" },
            {
                key: "productIsUse",
                label: "사용여부",
                align:"center",
                type: "select",
                options: [{ label: 1, value: "사용" }, { label: 0, value: "미사용" }],
                render: renderUseStatus
            }
        ]
    },
    storage: {
        title: "창고등록",
        apiUrl: "/api/base/whse",
        idKey: "storageId",
        // 표(Table)에 보여줄 컬럼들
        columns: [
            { key: "storageCord", label: "창고코드" },
            { key: "storageName", label: "창고명" },
            { key: "storageAddress", label: "창고주소" },
            { key: "storageIsUse", label: "사용여부" ,align:"center"}
        ],
        // 등록/수정 모달(Modal)에 나타날 입력창들
        fields: [
            { key: "storageCord", label: "창고코드", type: "text" },
            { key: "storageName", label: "창고명", type: "text" },
            { key: "storageAddress", label: "창고주소 ", type: "text" },
            {
                key: "storageIsUse",
                label: "사용여부",
                align:"center",
                type: "select",
                options: [{ label: "사용", value: 1 }, { label: "미사용", value: 0 }],
                render: renderUseStatus
            }
        ]
    },
    vendor: {
        title: "거래처등록",
        apiUrl: "/api/base/partner",
        idKey: "vendorId",
        // 표(Table)에 보여줄 컬럼들
        columns: [
            {key: "vendorCord", label: "거래처코드"},
            {key: "vendorName", label: "거래처명"},
            {key: "vendorIsUse", label: "사용여부",align:"center" }
        ],
        // 등록/수정 모달(Modal)에 나타날 입력창들
        fields: [
            {key: "vendorCord", label: "거래처코드", type: "text"},
            {key: "vendorName", label: "거래처명", type: "text"},
            {
                key: "vendorIsUse",
                label: "사용여부",
                align:"center",
                type: "select",
                options: [{label: "사용", value: 1}, {label: "미사용", value: 0}],
                render: renderUseStatus
            }
        ]
    },

        // 연차기본사항
        annualLeaves: {
                title: "연차기본사항",
                apiUrl: "/api/hr/annualLeaves",
                idKey: "basicVacationId",
                // 표(Table)에 보여줄 컬럼들
                columns: [
                    { key: "gradeCord", label: "직급코드" },
                    { key: "gradeName", label: "직급명" },
                    { key: "basicVacationDay", label: "연차일수" },
                 ],
                // 등록/수정 모달(Modal)에 나타날 입력창들
                fields: [
                    { key: "gradeCord", label: "직급코드", type: "number" },
                    { key: "gradeName", label: "직급명", type: "text" },
                    { key: "basicVacationDay", label: "연차일수", type: "number" },

            ]
    }


}