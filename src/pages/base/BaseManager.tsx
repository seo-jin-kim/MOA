import { useState, useEffect } from 'react';
import {baseConfigs} from "../../types/baseConfigs.tsx";
import Table from "../../components/Table.tsx";
import { FaStar } from "react-icons/fa";
import BaseModal from "../../components/base/BaseModal.tsx";
import {deleteBaseData, getBaseData} from "../../apis/BaseService.tsx";

// 인사 - 연차기본사항 포함

interface BaseManagerProps {
    apiType: string;
}

const BaseManager = ({ apiType }: BaseManagerProps) => {

    const config = apiType in baseConfigs
        ? baseConfigs[apiType as keyof typeof baseConfigs]
        : null;

    //페이지네이션
    const [page, setPage] = useState(0); // 현재 페이지 (0부터 시작)
    const [totalPages, setTotalPages] = useState(0); // 전체 페이지 수

    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // 선택 아이디
    const [selectedIds, setSelectedIds] = useState<any[]>([]);

    // 모달 제어 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const fetchData = async () => {
        if (!config) return;
        setLoading(true);
        try {
            const data = await getBaseData(apiType as keyof typeof baseConfigs, page);

            const item = Array.isArray(data) ? data : (data.content || []);
            console.log("필터링 후 items에 들어갈 데이터:", item);
            setItems(item);

            if (data && typeof data.totalPages === 'number') {
                setTotalPages(data.totalPages);
            }

        } catch (err) {
            console.error(`${config.title} 데이터 로드 실패:`, err);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    // 4. 메뉴(type)가 바뀔 때마다 실행
    useEffect(() => {
        fetchData();
    }, [apiType, page]);

    // 잘못된 경로 접근 시 처리
    if (!config) {
        return <div>존재하지 않는 관리 페이지입니다.</div>;
    }

    // 체크박스 핸들러
    const handleCheck = (idOrIds: any, isChecked: boolean, isAll?: boolean) => {
        if (isAll) {
            // 전체 선택/해제일 때
            setSelectedIds(isChecked ? idOrIds : []);
        } else {
            // 개별 선택/해제일 때
            if (isChecked) {
                setSelectedIds((prev) => (prev.includes(idOrIds) ? prev : [...prev, idOrIds]));
            } else {
                setSelectedIds((prev) => prev.filter((id) => id !== idOrIds));
            }
        }
    };
    // 등록 버튼 (데이터 없음)
    const handleInsertOpen = () => {
        setSelectedItem(null);
        setIsModalOpen(true);
    };

    // 코드 클릭-수정창 (데이터 있음)
    const handleEditOpen = (item: any) => {
        console.log("코드를 클릭함! 넘어온 데이터:", item);
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    // 삭제
    const handleDelete = async () => {
        if (selectedIds.length === 0) {
            alert("삭제할 항목을 선택해주세요.");
            return;
        }

        if (!window.confirm(`주의: 연결된 정보도 함께 삭제됩니다.\n선택한 ${selectedIds.length}건의 데이터를 삭제하시겠습니까?`)) return;

        try {
            setLoading(true);
            const failedMessages: string[] = []; // 실패한 메시지들을 담을 배열

            // 개별 삭제 실행
            for (const id of selectedIds) {
                try {
                    await deleteBaseData(apiType as keyof typeof baseConfigs, id);
                } catch (err: any) {
                    // 특정 ID 삭제 실패 시 메시지 수집
                    const msg = err.response?.data?.message || `ID ${id}: 삭제 중 오류 발생`;
                    failedMessages.push(msg);
                }
            }

            // 결과 알림
            if (failedMessages.length === 0) {
                alert("모든 데이터가 성공적으로 삭제되었습니다.");
            } else if (failedMessages.length === selectedIds.length) {
                alert(`삭제 실패:\n${failedMessages.join('\n')}`);
            } else {
                alert(`일부 삭제 완료 (실패 ${failedMessages.length}건):\n${failedMessages.join('\n')}`);
            }

            // 후처리: 무조건 새로고침해서 성공한 것만이라도 반영된 목록 보여주기
            setSelectedIds([]);
            fetchData();

        } catch (err) {
            console.error("삭제 프로세스 오류:", err);
            alert("시스템 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div>
            <div>
                <div className="favorite-Header">
                    <FaStar size={18} color="#C4C4C4"/>
                    <span>{config.title} 리스트</span>
                </div>

                {/* 테이블 영역 */}
                {loading ? (
                    <span>데이터를 불러오는 중입니다...</span>
                ) : (
                    <Table
                        idKey={config.idKey}
                        items={items}
                        columns={config.columns.map((col:any) => ({
                            ...col,
                            render: (val: any, item: any) =>
                                // 특정 컬럼 클릭 시 모달 열리게 렌더링 주입
                                col.key.toLowerCase().includes('cord') ? (
                                    <span
                                        onClick={() => handleEditOpen(item)}
                                        style={{cursor:'pointer', textDecoration:'underline', color: 'var(--text-accent)'}}
                                    >
                                        {col.render? col.render(val, item) : val}
                                    </span>
                                ) : (
                                    col.render? col.render(val, item) : val
                                )
                        }))}
                        showCheckbox={true}
                        selectedIds={selectedIds}
                        onCheck={(idOrIds, checked, isAll)=>handleCheck(idOrIds, checked, isAll)}
                    />
                )}
            </div>
            <div className="btn-Wrap" style={{marginTop:"12px"}}>
                <button type="submit" onClick={handleInsertOpen} className="btn-Primary" >등록</button>
                <button type="submit" onClick={handleDelete}  className="btn-Secondary">삭제</button>
            </div>
            <BaseModal
                key={selectedItem? selectedItem[config.idKey] : ('new' as any)}
                title={config.title}
                isOpen={isModalOpen}
                apiType={apiType as keyof typeof baseConfigs}
                onClose={() =>{
                    setIsModalOpen(false);
                    setSelectedItem(null);
                }}
                baseData={selectedItem} // 있으면 수정, 없으면 등록
                fetchData={fetchData}
                columns={config.columns}
            />
            <div className="Page-Btn-container" style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center' }}>
                <button
                    disabled={page === 0}
                    onClick={() => setPage(prev => prev - 1)}
                >
                    이전
                </button>

                {[...Array(totalPages)].map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setPage(i)}
                        style={{ fontWeight: page === i ? 'bold' : 'normal', color: page === i ? 'var(--text-accent)' : 'black' }}
                    >
                        {i + 1}
                    </button>
                ))}

                <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(prev => prev + 1)}
                >
                    다음
                </button>
            </div>
        </div>
    );
};

export default BaseManager;