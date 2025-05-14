import React, { useState, useEffect } from "react";
import { API_URL } from "../utils/apiConfig";

function EditFileModal({ file, currentPath, token, onClose, onSave }) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      const downloadUrl = `${API_URL}/file-manager/download?path=${encodeURIComponent(`${currentPath}/${file.name}`)}`;
      const response = await fetch(downloadUrl, {
        headers: {
          Authorization: token,
        },
      });

      if (!response.ok) {
        alert("Не удалось загрузить файл");
        onClose();
        return;
      }

      const text = await response.text();
      setContent(text);
      setIsLoading(false);
    };

    fetchContent();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const saveUrl = `${API_URL}/file-manager/edit`;
      const response = await fetch(saveUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          path: `${currentPath}/${file.name}`,
          content,
        }),
      });

      if (!response.ok) throw new Error("Ошибка при сохранении");

      onSave();
    } catch (err) {
      alert("Ошибка при сохранении файла");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white w-3/4 h-3/4 rounded shadow-lg flex flex-col">
        <div className="p-4 border-b flex justify-between">
          <h3>Редактирование: {file.name}</h3>
          <button onClick={onClose} disabled={isSaving} className="text-red-500">
            Закрыть
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 p-4">Загрузка...</div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 p-4 font-mono resize-none focus:outline-none"
          />
        )}

        <div className="p-4 border-t flex justify-end space-x-2">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 bg-gray-300 rounded"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            {isSaving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditFileModal;