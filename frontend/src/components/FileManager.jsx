import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../utils/apiConfig";

function FileIcon({ type }) {
  let icon = null;

  switch (type) {
    case "folder":
      icon = (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-6 h-6"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
      );
      break;

    case "txt":
    case "js":
    case "json":
      icon = (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="#fff"
          stroke="currentColor"
          strokeWidth="2"
          className="w-6 h-6"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <path d="M14 2v6h6"></path>
          <line x1="9" y1="13" x2="15" y2="13"></line>
          <line x1="9" y1="17" x2="15" y2="17"></line>
        </svg>
      );
      break;

    case "zip":
      icon = (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="#f7dc6f"
          stroke="currentColor"
          strokeWidth="2"
          className="w-6 h-6"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <path d="M14 2v6h6"></path>
          <rect x="8" y="12" width="8" height="4" rx="1"></rect>
        </svg>
      );
      break;

    case "jar":
      icon = (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="#f39c12"
          stroke="currentColor"
          strokeWidth="2"
          className="w-6 h-6"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <text x="12" y="16" textAnchor="middle" fill="#fff" fontSize="10">
            JAR
          </text>
        </svg>
      );
      break;

    case "yml":
    case "yaml":
      icon = (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="#3498db"
          stroke="currentColor"
          strokeWidth="2"
          className="w-6 h-6"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <text x="12" y="16" textAnchor="middle" fill="#fff" fontSize="10">
            YML
          </text>
        </svg>
      );
      break;

    case "css":
      icon = (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="#2980b9"
          stroke="currentColor"
          strokeWidth="2"
          className="w-6 h-6"
        >
          <circle cx="12" cy="12" r="10" />
          <text x="12" y="16" textAnchor="middle" fill="#fff" fontSize="10">
            CSS
          </text>
        </svg>
      );
      break;

    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
      icon = (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="#2ecc71"
          stroke="currentColor"
          strokeWidth="2"
          className="w-6 h-6"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <circle cx="10" cy="14" r="3"></circle>
          <line x1="2" y1="20" x2="22" y2="20"></line>
        </svg>
      );
      break;

    case "pdf":
      icon = (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="#e74c3c"
          stroke="currentColor"
          strokeWidth="2"
          className="w-6 h-6"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <text x="12" y="16" textAnchor="middle" fill="#fff" fontSize="10">
            PDF
          </text>
        </svg>
      );
      break;

    default:
      icon = (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="#ccc"
          stroke="currentColor"
          strokeWidth="2"
          className="w-6 h-6"
        >
          <circle cx="12" cy="12" r="10" />
          <text x="12" y="16" textAnchor="middle" fill="#fff" fontSize="10">
            ?
          </text>
        </svg>
      );
      break;
  }

  return icon;
}

// function Breadcrumb({ path, navigateTo }) {
//   const parts = path.split("/").filter(Boolean);
//   return (
//     <div className="flex items-center space-x-1 text-sm text-gray-600 mb-2">
//       <span
//         onClick={() => navigateTo("")}
//         className="cursor-pointer hover:underline"
//       >
//         public_html
//       </span>
//       {parts.map((part, i) => (
//         <React.Fragment key={i}>
//           <span>/</span>
//           <span
//             onClick={() => navigateTo(parts.slice(0, i + 1).join("/"))}
//             className="cursor-pointer hover:underline"
//           >
//             {part}
//           </span>
//         </React.Fragment>
//       ))}
//     </div>
//   );
// }

function normalizePath(path) {
  if (!path) return "";
  return path.split("/").filter(Boolean).join("/");
}

function Breadcrumb({ path, navigateTo }) {
  const parts = normalizePath(path).split("/").filter(Boolean);
  return (
    <div className="flex items-center space-x-1 text-sm text-gray-600 mb-2">
      <span
        onClick={() => navigateTo("")}
        className="cursor-pointer hover:underline"
      >
        server
      </span>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          <span>/</span>
          <span
            onClick={() => navigateTo(parts.slice(0, i + 1).join("/"))}
            className="cursor-pointer hover:underline"
          >
            {part}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

function FileListItem({ file, currentPath, refresh, token }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Удалить "${file.name}"?`)) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${API_URL}/file-manager/delete`, {
        headers: { Authorization: token },
        data: { path: `${currentPath}/${file.name}` },
      });
      refresh();
    } catch (err) {
      alert("Ошибка при удалении");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="group flex flex-col items-center p-2 hover:bg-gray-100 rounded cursor-pointer relative transition-all duration-200">
      {file.isDirectory ? (
        <div
          onClick={() =>
            (window.location.href = `/file-manager?path=${encodeURIComponent(
              normalizePath(`${currentPath}/${file.name}`)
            )}`)
          }
          className="flex flex-col items-center"
        >
          <FileIcon type="folder" />
          <span className="text-xs mt-1 text-gray-700 truncate w-24 text-center">
            {file.name}
          </span>
        </div>
      ) : (
        <a
          href={`${API_URL}/file-manager/download?path=${encodeURIComponent(
            `${currentPath}/${file.name}`
          )}`}
          download
          className="flex flex-col items-center"
        >
          <FileIcon type={file.name.split(".").pop()} />
          <span className="text-xs mt-1 text-gray-700 truncate w-24 text-center">
            {file.name}
          </span>
        </a>
      )}

      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-sm transition-opacity duration-200"
        aria-label="Удалить"
      >
        &times;
      </button>
    </div>
  );
}

function FileManager() {
  const [files, setFiles] = useState([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [uploadFiles, setUploadFiles] = useState([]);
  const [folderSize, setFolderSize] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [showUploadInput, setShowUploadInput] = useState(false);
  const token = localStorage.getItem("token");

  const search = new URLSearchParams(window.location.search);
  const initialPath = search.get("path") || "";
  const [currentPath, setCurrentPath] = useState(initialPath);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/file-manager/list`, {
        params: { path: currentPath },
        headers: { Authorization: token },
      });

      if (Array.isArray(res.data.files)) {
        setFiles(res.data.files);
      } else {
        setFiles([]);
      }

      setFolderSize(res.data.folderSize || 0);
    } catch (err) {
      console.error("Ошибка загрузки файлов:", err.message);
      setFiles([]);
      setFolderSize(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [currentPath]);

  // const fetchFiles = async (searchTerm = "") => {
  //   setIsLoading(true);
  //   setIsSearching(!!searchTerm);

  //   try {
  //     const endpoint = searchTerm
  //       ? "/file-manager/search"
  //       : "/file-manager/list";
  //     const params = searchTerm
  //       ? { query: searchTerm, path: currentPath }
  //       : { path: currentPath };

  //     const res = await axios.get(endpoint, {
  //       params,
  //       headers: { Authorization: token },
  //     });

  //     setFiles(res.data.files || []);
  //   } catch (err) {
  //     console.error("Ошибка загрузки файлов:", err.message);
  //     setFiles([]);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   if (!searchQuery) {
  //     fetchFiles();
  //   } else {
  //     fetchFiles(searchQuery);
  //   }
  // }, [currentPath]);

  const navigateTo = (newPath) => {
    const normalizedNewPath = normalizePath(newPath);
    const fullPath = `${normalizedNewPath}`;
    setCurrentPath(fullPath);
    window.history.replaceState(
      null,
      "",
      `/file-manager?path=${encodeURIComponent(fullPath)}`
    );
  };

  const handleUpload = async () => {
    if (!uploadFiles.length) return;

    for (const file of uploadFiles) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", currentPath);

      try {
        await axios.post(`${API_URL}/file-manager/upload`, formData, {
          headers: {
            Authorization: token,
            "Content-Type": "multipart/form-data",
          },
        });
      } catch (err) {
        alert(`Ошибка загрузки файла: ${file.name}`);
      }
    }

    setUploadFiles([]);
    fetchFiles();
  };

  const handleCreateFolder = async () => {
    if (!newFolderName) return;
    const fullPath = currentPath
      ? `${currentPath}/${newFolderName}`
      : newFolderName;
    try {
      await axios.post(
        `${API_URL}/file-manager/mkdir`,
        { path: fullPath },
        { headers: { Authorization: token } }
      );
      setNewFolderName("");
      fetchFiles();
    } catch (err) {
      alert("Ошибка при создании папки");
    }
  };

  function formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  return (
    <div className="flex h-screen">
      {isLoading && (
        <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-75 z-50">
          <div className="loader"></div>
        </div>
      )}
      <div className="w-64 bg-gray-200 p-4">
        <ul>
          {/* <li className="py-2">
            <a href="#" className="text-blue-600">
              Настроить аккаунт
            </a>
          </li>
          <li className="py-2">
            <a href="#" className="text-blue-600">
              Панель доступа
            </a>
          </li>
          <li className="py-2">
            <a href="#" className="text-blue-600">
              API достп
            </a>
          </li>
          <li className="py-2">
            <a href="#" className="text-blue-600">
              Мои миры
            </a>
          </li> */}
          <li className="py-2">
            <a href="/dashboard" className="text-blue-600">
              Консоль
            </a>
          </li>
          <li className="py-2">
            <a href="/file-manager" className="text-blue-600">
              Файловый менеджер
            </a>
          </li>
          {/* <li className="py-2">
            <a href="#" className="text-blue-600">
              Управление задачами
            </a>
          </li>
          <li className="py-2">
            <a href="#" className="text-blue-600">
              Конфигурация
            </a>
          </li> */}
        </ul>
      </div>
      <div className="flex-1 p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-lg font-bold">Файловый менеджер</h1>
        </div>
        {/* Навигация и список файлов */}
        <div className="flex mt-4">
          <div className="w-64 border-r p-2">
            <div className="mb-4">
              {/* Панель иконок */}
              <div className="relative mb-4">
                <div className="flex space-x-4 text-gray-600">
                  {/* Иконка создания папки */}
                  <button onClick={() => setShowFolderInput(!showFolderInput)}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-6 h-6 hover:text-blue-500 transition"
                    >
                      <path d="M4 12h16v6H4z"></path>
                      <path d="M12 4l-2 4H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-6l-2-4z"></path>
                    </svg>
                  </button>
                  {/* Иконка загрузки файла */}
                  <button onClick={() => setShowUploadInput(!showUploadInput)}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-6 h-6 hover:text-blue-500 transition"
                    >
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
                      <polyline points="7 10 12 5 17 10"></polyline>
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                    </svg>
                  </button>
                </div>
                {/* Поле для создания папки */}
                {showFolderInput && (
                  <div className="absolute top-full left-0 mt-1 bg-white border rounded shadow-md z-50 p-3">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Имя папки"
                      className="border rounded px-2 py-1 w-full mb-2"
                    />
                    <button
                      onClick={handleCreateFolder}
                      className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Создать
                    </button>
                  </div>
                )}
                {/* Поле загрузки файла */}
                {showUploadInput && (
                  <div className="absolute top-full left-0 mt-1 bg-white border rounded shadow-md z-50 p-3 w-64">
                    {/* Зона перетаскивания */}
                    <div
                      onDrop={(e) => {
                        e.preventDefault();
                        const files = Array.from(e.dataTransfer.files);
                        setUploadFiles(files);
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      className="border-2 border-dashed border-gray-400 rounded p-4 text-center mb-2 cursor-pointer hover:bg-gray-50 transition"
                    >
                      <p className="text-sm text-gray-600">
                        Перетащите сюда файлы или папки
                      </p>
                    </div>

                    {/* Инпут для выбора файлов */}
                    <input
                      type="file"
                      multiple
                      webkitdirectory
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        setUploadFiles(files);
                      }}
                      className="mb-2 w-full"
                    />

                    {/* Список загруженных файлов */}
                    {uploadFiles.length > 0 && (
                      <ul className="text-xs text-gray-600 max-h-32 overflow-y-auto mb-2">
                        {uploadFiles.map((file, i) => (
                          <li key={i} title={file.name}>
                            • {file.name}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Кнопка загрузить */}
                    <button
                      onClick={handleUpload}
                      disabled={!uploadFiles.length}
                      className={`w-full px-3 py-1 rounded text-sm ${
                        uploadFiles.length
                          ? "bg-blue-500 text-white hover:bg-blue-600"
                          : "bg-gray-300 cursor-not-allowed"
                      }`}
                    >
                      Загрузить
                    </button>

                    {/* Отмена */}
                    <button
                      onClick={() => setShowUploadInput(false)}
                      className="w-full mt-1 bg-gray-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Отмена
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* <Breadcrumb path={currentPath} navigateTo={navigateTo} /> */}
            <ul>
              <li
                onClick={() => navigateTo("")}
                className="py-1 pl-4 bg-blue-100 cursor-pointer"
              >
                server
              </li>
              {files
                .filter((f) => f.isDirectory)
                .map((file, i) => (
                  <li
                    key={i}
                    onClick={() => navigateTo(`${currentPath}/${file.name}`)}
                    className="py-1 pl-8 cursor-pointer hover:bg-gray-100"
                  >
                    {file.name}
                  </li>
                ))}
            </ul>
          </div>
          <div className="flex-1 p-2">
            <div className="mb-4 flex items-center gap-2"></div>
            <div className="grid grid-cols-6 gap-2">
              {files.map((file, index) => (
                <FileListItem
                  key={index}
                  file={file}
                  currentPath={currentPath}
                  refresh={fetchFiles}
                  token={token}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="bg-gray-100 p-2 text-sm text-gray-600 flex justify-between items-center mt-4">
          <Breadcrumb path={currentPath} navigateTo={navigateTo} />

          <span>
            Файлов: {files.length}, Размер:{" "}
            {formatBytes(
              folderSize || files.reduce((acc, f) => acc + f.size, 0)
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export default FileManager;
