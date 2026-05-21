import {MdSearch} from "react-icons/md";

interface TagInputProps {
    selectedIds: number[];
    members: {userId: number; userName: string}[];
    onRemove: (id: number) => void;
    onClear: () => void;
    onClick: () => void;
    disabled?: boolean;
    placeholder?: string;
    maxVisible?: number;
}

const TagInput = ({selectedIds, members, onRemove, onClear, onClick, disabled = false,
                      placeholder = "성명", maxVisible = 3,}: TagInputProps) => {

    return (
        <div style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            border: "0.5px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            overflow: "hidden",
            height:"27px",
            background: "var(--color-inverse)",
            opacity: 1,
            cursor:"pointer"
        }}>
            <div
                onClick={() => { if (!disabled) onClick(); }}
                style={{
                width: "30px",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRight: "0.5px solid var(--border)",
                flexShrink: 0,
            }}>
                <MdSearch color="#cdcdcd" size={16}/>
            </div>
            <div
                onClick={() => { if (!disabled) onClick(); }}
                style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "0 8px",
                    overflow: "hidden",
                    cursor:  "pointer",
                    height: "100%",
                }}
            >
                {selectedIds.slice(0, maxVisible).map(id => {
                    const member = members.find(m => m.userId === id);
                    if (!member) return null;
                    return (
                        <span
                            key={id}
                            style={{
                                fontSize: "12px",
                                background: "#5E5C77",
                                color: "#ffffff",
                                fontWeight:"100",
                                borderRadius: "20px",
                                padding: "2px 8px",
                                whiteSpace: "nowrap",
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                                flexShrink: 0,
                            }}
                        >
                            {member?.userName}
                            <span
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove(id);
                                }}
                                style={{cursor: "pointer", lineHeight: 1,fontSize:"15px"}}
                            >×</span>
                        </span>
                    );
                })}

                {selectedIds.length > maxVisible && (
                    <span style={{
                        fontSize: "12px",
                        background: "var(--color-gray-100)",
                        border:"1px solid var(--border)",
                        color: "var(--text-secondary)",
                        borderRadius: "20px",
                        padding: "2px 10px",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                    }}>
                        +{selectedIds.length - maxVisible}명
                    </span>
                )}
                {selectedIds.length === 0 && (
                    <span style={{fontSize: "13px", color: "var(--text-tertiary)"}}>
                        {placeholder}
                    </span>
                )}
            </div>
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        onClear();
                    }}
                    style={{
                        width: "30px",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderLeft: "0.5px solid var(--border)",
                        flexShrink: 0,
                        cursor: "pointer",
                        color: "#cdcdcd",
                        fontSize: "20px",
                        lineHeight:"27px",
                    }}
                >×</div>
        </div>
    );
};

export default TagInput;