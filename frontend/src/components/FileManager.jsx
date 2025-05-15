import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_URL } from "../utils/apiConfig";
import EditFileModal from "./EditFileModal";

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
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1-2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
      );
      break;
    case "txt":
    case "properties":
    case "js":
    case "json":
    case "conf":
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

function RenameModal({ oldName, onClose, onRename, currentPath, token }) {
  const [newName, setNewName] = useState(oldName);
  const inputRef = useRef();

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleRename = async () => {
    if (!newName || newName === oldName) return;
    try {
      await fetch(`${API_URL}/file-manager/rename`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          oldPath: `${currentPath}/${oldName}`,
          newPath: `${currentPath}/${newName}`,
        }),
      });
      onRename(newName);
    } catch (err) {
      alert("Ошибка при переименовании");
    } finally {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-4 rounded shadow-lg max-w-xs w-full">
        <h3 className="text-lg font-semibold mb-2">Переименовать</h3>
        <input
          type="text"
          value={newName}
          ref={inputRef}
          onChange={(e) => setNewName(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full mb-3"
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
          >
            Отмена
          </button>
          <button
            onClick={handleRename}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Переименовать
          </button>
        </div>
      </div>
    </div>
  );
}

function FileListItem({ file, currentPath, refresh, token, onRightClick }) {
  // const [isDeleting, setIsDeleting] = useState(false);

  // const handleDelete = async () => {
  //   if (!window.confirm(`Удалить "${file.name}"?`)) return;
  //   setIsDeleting(true);
  //   try {
  //     await axios.delete(`${API_URL}/file-manager/delete`, {
  //       headers: { Authorization: token },
  //       data: { path: `${currentPath}/${file.name}` },
  //     });
  //     refresh();
  //   } catch (err) {
  //     alert("Ошибка при удалении");
  //   } finally {
  //     setIsDeleting(false);
  //   }
  // };

  const handleOpenFolder = () => {
    if (file.isDirectory) {
      window.location.href = `/file-manager?path=${encodeURIComponent(
        normalizePath(`${currentPath}/${file.name}`)
      )}`;
    }
  };

  return (
    <div
      onContextMenu={(e) => onRightClick(e, file)}
      className="group flex flex-col items-center p-2 hover:bg-gray-100 rounded cursor-pointer relative transition-all duration-200"
    >
      {file.isDirectory ? (
        <div onClick={handleOpenFolder} className="flex flex-col items-center">
          <FileIcon type="folder" />
          <span className="text-xs mt-1 text-gray-700 truncate w-24 text-center">
            {file.name}
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <FileIcon type={file.name.split(".").pop()} />
          <span className="text-xs mt-1 text-gray-700 truncate w-24 text-center">
            {file.name}
          </span>
        </div>
      )}

      {/* <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-sm transition-opacity duration-200"
        aria-label="Удалить"
      >
        &times;
      </button> */}
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFile, setEditingFile] = useState(null);

  const [contextMenu, setContextMenu] = useState({
    show: false,
    x: 0,
    y: 0,
    file: null,
  });
  const [showGlobalMenu, setShowGlobalMenu] = useState({
    show: false,
    x: 0,
    y: 0,
  });
  const [showRenameModal, setShowRenameModal] = useState(false);

  const [isDragging, setIsDragging] = useState(false);

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

  useEffect(() => {
    const handleClickOutside = () => {
      if (showGlobalMenu.show) {
        setShowGlobalMenu({ ...showGlobalMenu, show: false });
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showGlobalMenu.show]);

  const navigateTo = (newPath) => {
    const normalizedNewPath = normalizePath(newPath);
    const fullPath = normalizedNewPath;
    setCurrentPath(fullPath);
    window.history.replaceState(
      null,
      "",
      `/file-manager?path=${encodeURIComponent(fullPath)}`
    );
  };

  // const handleUpload = async () => {
  //   if (!uploadFiles.length) return;
  //   for (const file of uploadFiles) {
  //     const formData = new FormData();
  //     formData.append("file", file);
  //     formData.append("path", currentPath);
  //     try {
  //       await axios.post(`${API_URL}/file-manager/upload`, formData, {
  //         headers: {
  //           Authorization: token,
  //           "Content-Type": "multipart/form-data",
  //         },
  //       });
  //     } catch (err) {
  //       alert(`Ошибка загрузки файла: ${file.name}`);
  //     }
  //   }
  //   setUploadFiles([]);
  //   fetchFiles();
  // };
  const handleUpload = async () => {
    // console.debug("Запуск загрузки...", uploadFiles);
    if (!uploadFiles.length) return;

    const formData = new FormData();

    const relativePaths = uploadFiles.map(
      (file) => file.relativePath || file.name
    );
    formData.append("relativePaths", JSON.stringify(relativePaths));
    formData.append("path", currentPath);

    for (const file of uploadFiles) {
      formData.append("file", file);
    }

    try {
      await axios.post(`${API_URL}/file-manager/upload`, formData, {
        headers: {
          Authorization: token,
          "Content-Type": "multipart/form-data",
        },
      });

      fetchFiles();
      setUploadFiles([]);
    } catch (err) {
      alert("Ошибка при загрузке файлов");
    }
  };

  useEffect(() => {
    if (uploadFiles.length > 0) {
      handleUpload();
    }
  }, [uploadFiles]);

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

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.show) {
        setContextMenu({ ...contextMenu, show: false });
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [contextMenu.show]);

  const handleRightClick = (e, file) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      file,
    });
  };

  const openRenameModal = () => {
    setShowRenameModal(true);
    setContextMenu({ ...contextMenu, show: false });
  };

  const handleDelete = async () => {
    const file = contextMenu.file;
    if (!window.confirm(`Удалить "${file.name}"?`)) return;
    try {
      await axios.delete(`${API_URL}/file-manager/delete`, {
        headers: { Authorization: token },
        data: { path: `${currentPath}/${file.name}` },
      });
      fetchFiles();
    } catch (err) {
      alert("Ошибка при удалении");
    }
  };

  const handleDownload = () => {
    const file = contextMenu.file;
    const fullPath = `${currentPath}/${file.name}`;
    const downloadUrl = `${API_URL}/file-manager/download?path=${encodeURIComponent(
      fullPath
    )}`;

    fetch(downloadUrl, {
      method: "GET",
      headers: {
        Authorization: token,
      },
    })
      .then(async (res) => {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Ошибка доступа к файлу");
        }

        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error(err);
        alert("Ошибка при скачивании файла. Возможно, вы не авторизованы.");
      });

    setContextMenu({ ...contextMenu, show: false });
  };

  const handleOpenFolder = () => {
    const file = contextMenu.file;
    if (file.isDirectory) {
      navigateTo(`${currentPath}/${file.name}`);
    }
  };

  const handleSelectDirectory = async () => {
    try {
      if (!window.showDirectoryPicker) {
        alert("Поддержка выбора папок доступна только в Chrome / Edge");
        return;
      }
  
      const dirHandle = await window.showDirectoryPicker();
      const selectedFolderName = dirHandle.name;
  
      async function readDirectory(entry, currentPath = "") {
        const files = [];
  
        if (entry.kind === "file") {
          const file = await entry.getFile();
  
          const relativePath = `${selectedFolderName}${currentPath ? '/' + currentPath : ''}`;
          files.push(Object.defineProperty(file, 'relativePath', {
            value: relativePath,
            configurable: false,
            writable: false
          }));
        } else if (entry.kind === "directory") {
          const entries = entry.entries();
          for await (const [name, childEntry] of entries) {
            const subFiles = await readDirectory(childEntry, currentPath ? `${currentPath}/${name}` : name);
            files.push(...subFiles);
            console.log(files);
          }
        }
  
        return files;
      }
  
      const allFiles = await readDirectory(dirHandle);
      setUploadFiles(allFiles);
    } catch (err) {
      console.error("Ошибка при выборе папки:", err);
      alert("Произошла ошибка при выборе папки.");
    }
  };

  const openEditModal = (file) => {
    setEditingFile(file);
    setShowEditModal(true);
  };

  return (
    <div className="flex h-screen">
      {isLoading && (
        <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-75 z-50">
          <div className="loader"></div>
        </div>
      )}

      <div className="w-64 bg-gray-200 p-4">
        <ul>
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
        </ul>
      </div>

      <div className="flex-1 p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-lg font-bold">Файловый менеджер</h1>
        </div>

        <div className="flex mt-4">
          <div className="w-64 border-r p-2">
            <div className="relative mb-4">
              <div className="flex space-x-4 text-gray-600">
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

              {/* Поле создания папки */}
              {/* {showFolderInput && (
                <div className="absolute top-full left-0 mt-1 bg-white border rounded shadow-md z-50 p-3">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Имя папки"
                    className="border rounded px-2 py-1 w-full mb-2"/>
                  <button
                    onClick={handleCreateFolder}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm">Создать</button>
                </div>
              )} */}
              {showEditModal && editingFile && (
                <EditFileModal
                  file={editingFile}
                  currentPath={currentPath}
                  token={token}
                  onClose={() => setShowEditModal(false)}
                  onSave={() => {
                    fetchFiles();
                  }}
                />
              )}

              {/* Поле загрузки файла */}
              {showUploadInput && (
                <div className="absolute top-full left-0 mt-1 bg-white border rounded shadow-md z-50 p-3 w-64">
                  {/* <input
                    type="file"
                    multiple
                    directory=""
                    webkitdirectory
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      setUploadFiles(files);
                    }}
                    className="mb-2 w-full"
                  /> */}
                  <button
                    onClick={handleSelectDirectory}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full text-left"
                  >
                    Выбор папки для загрузки
                  </button>
                  {uploadFiles.length > 0 && (
                    <ul className="text-xs text-gray-600 max-h-32 overflow-y-auto mb-2">
                      {uploadFiles.map((file, i) => (
                        <li key={i}>• {file.name}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

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
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const files = Array.from(e.dataTransfer.files);
              setUploadFiles((prev) => [...prev, ...files]);
            }}
            className={`flex-1 p-2 transition-all duration-200 ${
              isDragging
                ? "bg-blue-50 border-2 border-dashed border-blue-400"
                : ""
            }`}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowGlobalMenu({
                show: true,
                x: e.clientX,
                y: e.clientY,
              });
            }}
          >
            <div className="grid grid-cols-6 gap-2">
              {files.map((file, index) => (
                <FileListItem
                  key={index}
                  file={file}
                  currentPath={currentPath}
                  refresh={fetchFiles}
                  token={token}
                  onRightClick={handleRightClick}
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

      {/* Контекстное меню */}
      {contextMenu.show && contextMenu.file && (
        <div
          className="fixed z-50 bg-white border rounded shadow-md"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <ul>
            {contextMenu.file.isDirectory && (
              <li
                onClick={handleOpenFolder}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                Открыть
              </li>
            )}
            {!contextMenu.file.isDirectory && (
              <li
                onClick={() => {
                  openEditModal(contextMenu.file);
                }}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                Редактировать
              </li>
            )}
            <li
              onClick={openRenameModal}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            >
              Переименовать
            </li>
            {!contextMenu.file.isDirectory && (
              <li
                onClick={handleDownload}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                Скачать
              </li>
            )}
            <li
              onClick={handleDelete}
              className="px-4 py-2 hover:bg-red-100 text-red-600 cursor-pointer"
            >
              Удалить
            </li>
          </ul>
        </div>
      )}

      {/* Модалка для переименования */}
      {showRenameModal && contextMenu.file && (
        <RenameModal
          oldName={contextMenu.file.name}
          currentPath={currentPath}
          token={token}
          onClose={() => setShowRenameModal(false)}
          onRename={() => {
            fetchFiles();
            setShowRenameModal(false);
          }}
        />
      )}

      {/* Модальное окно: Создать папку */}
      {showFolderInput && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
            onClick={() => setShowFolderInput(false)}
          ></div>

          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div
              className="bg-white rounded-lg shadow-xl w-80 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">
                Создать новую папку
              </h3>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Имя папки"
                className="border rounded px-3 py-2 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowFolderInput(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreateFolder}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                >
                  Создать
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default FileManager;
