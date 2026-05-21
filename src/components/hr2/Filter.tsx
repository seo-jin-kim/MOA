import {hr2Configs} from "../../types/hr2Configs.tsx";
import {useEffect, useState} from "react";
import FilterDate from "./FilterDate.tsx";
import Modal from "../Modal.tsx";
import TestTagInput from "../input/TestTagInput.tsx";
import {getFilterSearch, getTapSearch} from "../../apis/hr2/FilterService.tsx";


interface FilterProps {
    apiType: keyof typeof hr2Configs;
    onFilter: (params: any) => void;
}


const Filter = ({ apiType, onFilter }: FilterProps) => {
    const config = hr2Configs[apiType];
    const fields = (config && "fields" in config) ? config.fields : [];

    const [dates, setDates] = useState({start: {y: null, m: null, d: null}, end: {y: null, m: null, d: null}});
    const [searchValues, setSearchValues] = useState<any>({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeField, setActiveField] = useState<any>(null);
    const [tapOptions, setTapOptions] = useState<any[]>([]);

    // 모달 내 검색 결과 및 입력어 상태
    const [keyword, setKeyword] = useState("");
    const [results, setResults] = useState<any[]>([]);

    const handleModalSearch = async () => {

        try {
            // 1. configs에서 설정한 url 가져오기 (없으면 기본값)
            const data = await getFilterSearch(activeField.id, keyword);
            setResults(data);

        } catch (e) {
            console.error("검색 실패:", e);
            setResults([]);
        }
    };

    const handleSelectItem = (item: any) => {

        const detail = fields.find((f: any) => f.searchType === activeField.id || f.key === activeField.id);

        const mapping = (detail && "mapTo" in detail) ? detail.mapTo : { id: 'id', name: 'name' };

        const idKey = mapping ? Object.values(mapping).find(key =>
            key?.toLowerCase().includes("id") || key?.toLowerCase().includes("cord")
        ) : undefined;
        const nameKey = mapping ? Object.values(mapping).find(key =>
            key?.toLowerCase().includes("name")
        ) : undefined;

        const newItem = {
            id: (idKey && item[idKey]) ? item[idKey] : item[''],
            name: (nameKey && item[nameKey]) ? item[nameKey] : item[''],
        };

        setSearchValues((prev: any) => {
            const currentList = prev[activeField.id] || [];
            // 중복 선택 방지
            if (currentList.find((i: any) => i.id === newItem.id)) return prev;
            return {
                ...prev,
                [activeField.id]: [...currentList, newItem] // 무조건 배열로 관리!
            };
        });
        setIsModalOpen(false);
        setResults([]); // 초기화
        setKeyword(""); // 초기화
    };

    const handleSearchClick = (selectedDept?: string) => {
        // 1. searchValues에서 ID만 추출해서 백엔드용 포맷으로 변환
        const formattedFilters = Object.keys(searchValues).reduce((acc: any, key) => {
            const val = searchValues[key];
            acc[key] = Array.isArray(val) ? val.map((item: any) => item.id) : val;
            return acc;
        }, {});

        const formatPartDate = (dateObj: any) => {
            // 연, 월, 일이 모두 있을 때만 문자열 생성
            if (dateObj.y && dateObj.m && dateObj.d) {
                return `${dateObj.y}-${dateObj.m}-${dateObj.d}`;
            }
            return "";
        }

        const params = {
            ...formattedFilters,
            // 버튼 클릭 시 들어온 selectedDept가 있으면 그걸 최우선으로 사용
            departmentId: selectedDept !== undefined
                ? (selectedDept === "" ? null : selectedDept)
                : (searchValues.departmentId || ""),
            startDate: formatPartDate(dates.start),
            finishDate: formatPartDate(dates.end)
        };
        // 디버깅 확인용
        console.log("백엔드로 보내는 최종 파라미터:", params);
        onFilter(params);
    };

    useEffect(() => {
        const fetchDepts = async () => {
            try {
                // 전체 부서 목록을 가져오는 API 호출
                const data = await getTapSearch();
                const formatted = data.map((d: any) => ({
                    value: d.departmentId,
                    label: d.departmentName
                }));
                setTapOptions(formatted);
            } catch (e) {
                console.error("부서 목록 로드 실패", e);
            }
        };
        fetchDepts();
    }, []);


    return (
        <div className="filter-container" style={{display:"flex",gap:"12px", background:"#fff", padding:" 15px 12px", borderRadius:"15px", flexWrap:"wrap"}}>
            {/* 1. 무조건 있는 날짜 컴포넌트 */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" , fontSize:"12px"}}>
                <FilterDate
                    label="일자"
                    value={dates.start}
                    onChange={(val: any) => setDates({...dates, start: val})}
                />
                <span style={{ alignSelf: 'center', padding: '10px auto' }}>~</span>
                <FilterDate
                    value={dates.end}
                    onChange={(val: any) => setDates({...dates, end: val})}
                />
            </div>
            {!(config as any).modalOnly &&(config as any).filterFields?.map((field:any) => (
                <div key={field.id} style={{ width: "200px" ,flex:"1"}}>
                    <TestTagInput
                        placeholder={field.label}
                        selectedItems={searchValues[field.id] || []}
                        onClick={() =>{
                            setActiveField(field);
                            setIsModalOpen(true);
                        }} // 해당 필드의 모달 오픈
                        onRemove={(itemId) => {
                            setSearchValues((prev:any) => ({
                                ...prev,
                                [field.id]: prev[field.id].filter((item:any) => item.id !== itemId)
                            }));
                        }}
                        onClear={() => setSearchValues((prev:any) => ({ ...prev, [field.id]: [] }))}
                    />
                </div>
            ))}

            {/* 3. 공용 모달 연결 */}
            <Modal
                title={`${activeField?.label} 검색`} // 모달 헤더와 타이틀에 자동 반영
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setResults([]);
                    setKeyword("");
                }}
                footer={
                    <button onClick={() => setIsModalOpen(false)}>닫기</button>
                }
            >
                <div className="search-content">
                    <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleModalSearch()}
                        placeholder="검색어를 입력하세요"
                    />
                    <button onClick={handleModalSearch}>검색</button>

                    <table className="modal-table">
                        <thead>
                        <tr>
                            {/* configs에 정의된 컬럼들만 자동으로 출력 */}
                            {(activeField?.columns || config.columns.slice(1, 3)).map((col: any) => (
                                <th key={col.key}>{col.label}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {results.length > 0 ? (
                            results.map((item: any, idx: number) => (
                                <tr key={item.id || idx} onClick={() => handleSelectItem(item)} style={{cursor: 'pointer'}}>
                                    {activeField.columns.map((col: any) => (
                                        <td key={col.key}>{item[col.key]}</td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={activeField?.columns?.length || 1} style={{textAlign: 'center', padding: '20px'}}>
                                    검색 결과가 없습니다.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </Modal>
            {/*그룹버튼*/}
            {(config as any).tap?.map((tap:any) => {
                // 1. 그룹 버튼 타입일 경우
                if (tap.type === "groupButton") {
                    return (
                        <div key={tap.id} className="group-button-filter" style={{ display: 'flex', gap: '5px', alignItems: 'center', fontSize:"12px" ,border:"1px solid #e6e6e6",padding:"0 8px", borderRadius:"4px"}}>
                            <span style={{ fontWeight: '300', marginRight: '8px' }}>{tap.label}:</span>
                            <div className="btn-group" style={{ display: 'flex', gap: '18px' }}>
                                <button
                                    className={!searchValues[tap.id] ? "active" : ""}
                                    onClick={() => {
                                        setSearchValues({ ...searchValues, [tap.id]: "" });
                                        handleSearchClick("");
                                    }}
                                >전체</button>

                                {/* 받아온 옵션들  */}
                                {tapOptions.map((opt: any) => (
                                    <button
                                        key={opt.value}
                                        className={String(searchValues[tap.id]) === String(opt.value) ? "active" : ""}
                                        onClick={() => {
                                            const val = String(opt.value);
                                            setSearchValues({ ...searchValues, [tap.id]: val });
                                            handleSearchClick(opt.value);
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                return null;
            })}
            <button onClick={() => handleSearchClick()} className="btn-Primary">검색</button>
        </div>
    )
}

export default Filter;