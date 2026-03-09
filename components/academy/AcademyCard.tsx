'use client';

interface AcademyCardProps {
  id: number;
  name: string;
  category?: string;
  onDelete: (id: number) => void;
}

export default function AcademyCard({
  id,
  name,
  category,
  onDelete,
}: AcademyCardProps) {
  const handleDelete = () => {
    if (confirm(`"${name}" 학원을 삭제하시겠습니까?\n관련된 모든 스케줄과 납부 정보도 함께 삭제됩니다.`)) {
      onDelete(id);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">{name}</h3>
          {category && (
            <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-md">
              {category}
            </span>
          )}
        </div>
        <button
          onClick={handleDelete}
          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
          aria-label="삭제"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
