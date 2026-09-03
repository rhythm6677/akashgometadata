import React, { useState, useRef, useEffect } from 'react';
import { Download, Plus, Trash2, Upload, Save, Grid, Edit2, Check, X, Archive, Image as ImageIcon } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const BulkContentManager = () => {
  const [namesList, setNamesList] = useState('');
  const [contentMode, setContentMode] = useState('short_extended');
  const [extensionPrefix, setExtensionPrefix] = useState('ShortMD');
  const [mdNumber, setMdNumber] = useState('1');
  const [provider, setProvider] = useState('AkashGo');
  const [contentType, setContentType] = useState('Web Shorts');
  const [keywords, setKeywords] = useState('Premier League, English Premier League, EPL, Premier League 2026/27, EPL 2026/27, Premier League 26/27, EPL 26/27, Premier League Highlights, EPL Highlights, Premier League 2026/27 Highlights, EPL 2026/27 Highlights, Football Highlights, Premier League Match Highlights, EPL Match Highlights, Extended Highlights, Premier League Extended Highlights, Match Recap, Matchday Recap, Matchweek Highlights, Premier League Matchweek Highlights, Goal Highlights, Premier League Goals, EPL Goals, All Goals, Best Goals, Top Goals, Top Plays, Key Moments, Best Moments, Full Time Highlights, Post-Match Highlights, English Football, English Football Highlights, Matchday Highlights, Weekend Highlights, Goals of the Week, Premier League Review, Matchweek Review, Premier League Season Highlights, Premier League On Demand, Football Recap, Watch Premier League Goals, Must-Watch Moments, Premier League Player Highlights, Premier League Team Highlights, Best Saves, Premier League 2026/27 Goals, Premier League 2026/27 Match Recap, Premier League 2026/27 Match Highlights, Erling Haaland, Haaland Highlights, Haaland Goals, Bruno Fernandes, Bruno Fernandes Highlights, Bruno Fernandes Goals, Cole Palmer, Palmer Highlights, Palmer Goals, Bukayo Saka, Saka Highlights, Saka Goals, Joao Pedro, Joao Pedro Highlights, Joao Pedro Goals, Dominik Szoboszlai, Szoboszlai Highlights, Szoboszlai Goals, Bryan Mbeumo, Mbeumo Highlights, Mbeumo Goals, Florian Wirtz, Wirtz Highlights, Wirtz Goals, Alexander Isak, Isak Highlights, Isak Goals, Matheus Cunha, Cunha Highlights, Cunha Goals, Gabriel, Gabriel Highlights, Gabriel Goals, Viktor Gyokeres, Gyokeres Highlights, Gyokeres Goals, Phil Foden, Foden Highlights, Foden Goals, Declan Rice, Rice Highlights, Rice Goals, Virgil van Dijk, Van Dijk Highlights, Van Dijk Goals, Morgan Gibbs-White, Gibbs-White Highlights, Morgan Rogers, Rogers Highlights, Antoine Semenyo, Semenyo Highlights, Bruno Guimaraes, Bruno Guimaraes Highlights, Martin Odegaard, Odegaard Highlights, Premier League Players 2026/27, Premier League Stars 2026/27, Premier League Top Players 2026/27, Premier League Best Players 2026/27, Premier League New Season, New Premier League Season, EPL New Season, Premier League 2026/27 Season Highlights');
  const [rating, setRating] = useState('U/A');
  const [durationSeconds, setDurationSeconds] = useState('');
  const [yearOfRelease, setYearOfRelease] = useState('2026');
  const [languages, setLanguages] = useState('English');
  const [summaryPrefix, setSummaryPrefix] = useState(': Premier League MD1 Short H/L');
  const [actor, setActor] = useState('');
  const [director, setDirector] = useState('');
  const [genres, setGenres] = useState('Sports');
  const [audioLanguages, setAudioLanguages] = useState('English');
  const [isHd, setIsHd] = useState('HD');
  const [expiryDate, setExpiryDate] = useState('2099-05-24');
  const [contentData, setContentData] = useState([]);
  const [savedSheets, setSavedSheets] = useState([]);
  const [currentSheetName, setCurrentSheetName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedSheetName, setEditedSheetName] = useState('');
  const [showSheetMenu, setShowSheetMenu] = useState(false);
  const [viewMode, setViewMode] = useState('form');
  const [editingCell, setEditingCell] = useState({ index: null, field: null, value: '' });
  const [columnWidths, setColumnWidths] = useState({
    actions: 80, contentId: 200, provider: 150, contentType: 150, keywords: 150,
    rating: 100, duration: 120, yearOfRelease: 100, landscape: 250, portrait: 250,
    languages: 120, summary: 300, title: 300, filename: 250, actor: 150, director: 150,
    genres: 150, audioLanguages: 150, isHd: 80, expiryDate: 120
  });
  const [resizing, setResizing] = useState(null);
  const tableRef = useRef(null);
  const topScrollRef = useRef(null);
  const bottomScrollRef = useRef(null);
  const [tableScrollWidth, setTableScrollWidth] = useState(0);
  const isSyncingScroll = useRef(false);
  const [uploadedImages, setUploadedImages] = useState([]);

  useEffect(() => {
    const loadSavedSheets = () => {
      try {
        const sheets = localStorage.getItem('savedSheets');
        if (sheets) {
          setSavedSheets(JSON.parse(sheets));
        }
      } catch (error) {
        console.error('Error loading saved sheets:', error);
      }
    };
    loadSavedSheets();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('savedSheets', JSON.stringify(savedSheets));
    } catch (error) {
      console.error('Error saving sheets:', error);
    }
  }, [savedSheets]);

  const normalizeText = (text) => {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '');
  };

  const generateContentId = (name, ext) => normalizeText(name) + ext;

  const handleModeChange = (mode) => {
    setContentMode(mode);
    if (mode === 'goals') {
      setExtensionPrefix('GoalsMD');
      setSummaryPrefix(': Premier League MD1 Goal H/L');
    } else {
      setExtensionPrefix('ShortMD');
      setSummaryPrefix(': Premier League MD1 Short H/L');
    }
  };

  const getImageDimensions = (file) => {
    return new Promise((resolve) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        resolve({ width: null, height: null });
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  };

  const getRowVersion = (row) => {
    const prefix = (row.extensionPrefix || '').toLowerCase();
    if (prefix.includes('extended')) return 'Extended';
    if (prefix.includes('short')) return 'Short';
    return 'Other';
  };

  const detectVersionFromName = (nameStr) => {
    if (/extended/i.test(nameStr)) return 'Extended';
    if (/short/i.test(nameStr)) return 'Short';
    return null;
  };

  const getUniqueMatchNames = () => {
    const seen = new Set();
    const names = [];
    contentData.forEach(row => {
      if (row.originalName && !seen.has(row.originalName)) {
        seen.add(row.originalName);
        names.push(row.originalName);
      }
    });
    return names;
  };

  const findMatchingName = (imageNamePrefix) => {
    const normalizedImage = normalizeText(imageNamePrefix).toLowerCase();
    let bestName = null;
    let bestLength = 0;
    contentData.forEach((row) => {
      const key = normalizeText(row.originalName || '').toLowerCase();
      if (key && normalizedImage.startsWith(key) && key.length > bestLength) {
        bestName = row.originalName;
        bestLength = key.length;
      }
    });
    return bestName;
  };

  const getAvailableVersions = (matchedName) => {
    const versions = new Set();
    contentData.forEach(row => {
      if (row.originalName === matchedName) versions.add(getRowVersion(row));
    });
    return versions;
  };

  const resolveRowIndex = (matchedName, version) => {
    if (!matchedName) return null;
    const matches = [];
    contentData.forEach((row, idx) => {
      if (row.originalName === matchedName) matches.push({ idx, version: getRowVersion(row) });
    });
    if (matches.length === 0) return null;
    if (matches.length === 1) return matches[0].idx;
    const exact = matches.find(m => m.version === version);
    if (exact) return exact.idx;
    const other = matches.find(m => m.version === 'Other');
    if (other) return other.idx;
    return null;
  };

  const computeNewFileName = (matchedName, version, orientation) => {
    const idx = resolveRowIndex(matchedName, version);
    if (idx === null || !contentData[idx]) return '';
    const row = contentData[idx];
    return orientation === 'Landscape' ? row.landscape : row.portrait;
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newEntries = [];
    for (const file of files) {
      const noExt = file.name.replace(/\.[^/.]+$/, '');
      const resMatch = noExt.match(/^(.*?)(\d{2,5})\s*[x*]\s*(\d{2,5})/i);
      let prefix = noExt;
      let width = null;
      let height = null;
      if (resMatch) {
        prefix = resMatch[1];
        width = parseInt(resMatch[2], 10);
        height = parseInt(resMatch[3], 10);
      }
      if (!width || !height) {
        const dims = await getImageDimensions(file);
        width = dims.width;
        height = dims.height;
      }
      const orientation = (width && height && width < height) ? 'Portrait' : 'Landscape';
      const matchedName = findMatchingName(prefix);
      const detected = detectVersionFromName(prefix);
      const available = matchedName ? getAvailableVersions(matchedName) : new Set();
      let version = detected;
      if (!version || (available.size > 0 && !available.has(version) && !available.has('Other'))) {
        if (available.size === 1) {
          version = [...available][0];
        } else if (!version) {
          version = null;
        }
      }

      newEntries.push({
        id: Date.now() + '_' + Math.random().toString(36).slice(2),
        file,
        originalName: file.name,
        previewUrl: URL.createObjectURL(file),
        width, height, orientation,
        matchedName,
        version
      });
    }

    setUploadedImages(prev => [...prev, ...newEntries]);
    e.target.value = '';
  };

  const updateImageOverride = (id, field, value) => {
    setUploadedImages(prev => prev.map(img => (
      img.id === id ? { ...img, [field]: value } : img
    )));
  };

  const removeImage = (id) => {
    setUploadedImages(prev => {
      const target = prev.find(img => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter(img => img.id !== id);
    });
  };

  const clearAllImages = () => {
    uploadedImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setUploadedImages([]);
  };

  const downloadImage = (img) => {
    const fileName = computeNewFileName(img.matchedName, img.version, img.orientation);
    if (!fileName) return alert('No matching content row for this image yet. Please select one manually.');
    const url = URL.createObjectURL(img.file);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllAsZip = async () => {
    const readyImages = uploadedImages
      .map(img => ({ img, fileName: computeNewFileName(img.matchedName, img.version, img.orientation) }))
      .filter(entry => entry.fileName);
    if (readyImages.length === 0) return alert('No matched images to download yet.');
    const zip = new JSZip();
    readyImages.forEach(entry => zip.file(entry.fileName, entry.img.file));
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'renamed_images_' + Date.now() + '.zip');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return day + '-' + month + '-' + date.getFullYear();
  };

  const handleGenerate = () => {
    const names = namesList.split(',').map(n => n.trim()).filter(n => n);
    if (names.length === 0) return alert('Please enter at least one name');

    const extension = extensionPrefix + mdNumber;

    const newData = names.map(name => {
      const contentId = generateContentId(name, extension);
      const summary = name + summaryPrefix;

      return {
        contentId, provider, contentType, keywords, rating,
        duration: durationSeconds, yearOfRelease,
        landscape: contentId + '_Landscape.jpg',
        portrait: contentId + '_Portrait.jpg',
        languages, summary, title: summary,
        filename: contentId + '.mp4',
        actor, director, genres, audioLanguages, isHd,
        expiryDate: expiryDate ? formatDate(expiryDate) : '',
        originalName: name,
        extensionPrefix: extensionPrefix
      };
    });
    setContentData([...contentData, ...newData]);

    setTimeout(() => {
      const tableElement = document.getElementById('content-table-section');
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const saveCurrentSheet = () => {
    if (contentData.length === 0) return alert('No data to save');
    const sheetName = currentSheetName || `Sheet_${Date.now()}`;

    const sheet = {
      name: sheetName,
      data: contentData,
      timestamp: Date.now()
    };

    const existingIndex = savedSheets.findIndex(s => s.name === sheetName);
    let updatedSheets;

    if (existingIndex >= 0) {
      updatedSheets = [...savedSheets];
      updatedSheets[existingIndex] = sheet;
      alert('✅ Sheet updated successfully!');
    } else {
      updatedSheets = [...savedSheets, sheet];
      alert('✅ Sheet saved successfully!');
    }

    setSavedSheets(updatedSheets);
    setCurrentSheetName(sheetName);
  };

  const loadSheet = (sheetName) => {
    const sheet = savedSheets.find(s => s.name === sheetName);
    if (sheet) {
      setContentData(sheet.data);
      setCurrentSheetName(sheetName);
      setShowSheetMenu(false);
      setViewMode('form');
    }
  };

  const deleteSheet = (sheetName, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${sheetName}"?`)) return;

    const updatedSheets = savedSheets.filter(s => s.name !== sheetName);
    setSavedSheets(updatedSheets);

    if (currentSheetName === sheetName) {
      setContentData([]);
      setCurrentSheetName('');
    }
  };

  const createNewSheet = () => {
    setContentData([]);
    setCurrentSheetName('');
    setShowSheetMenu(false);
    setViewMode('form');
  };

  const startEditingSheetName = () => {
    if (!currentSheetName) return alert('Please save the sheet first');
    setEditedSheetName(currentSheetName);
    setIsEditingName(true);
  };

  const saveSheetName = () => {
    if (!editedSheetName.trim()) return alert('Sheet name cannot be empty');
    if (savedSheets.some(s => s.name === editedSheetName && s.name !== currentSheetName)) {
      return alert('A sheet with this name already exists');
    }

    const updatedSheets = savedSheets.map(s =>
      s.name === currentSheetName ? { ...s, name: editedSheetName } : s
    );

    setSavedSheets(updatedSheets);
    setCurrentSheetName(editedSheetName);
    setIsEditingName(false);
  };

  const cancelEditingName = () => {
    setIsEditingName(false);
    setEditedSheetName('');
  };

  const startCellEdit = (index, field, value) => {
    setEditingCell({ index, field, value: value || '' });
  };

  const saveCellEdit = () => {
    if (editingCell.index !== null && editingCell.field) {
      const updated = [...contentData];
      updated[editingCell.index][editingCell.field] = editingCell.value;
      setContentData(updated);
      setEditingCell({ index: null, field: null, value: '' });
    }
  };

  const cancelCellEdit = () => setEditingCell({ index: null, field: null, value: '' });

  const handleDelete = (index) => setContentData(contentData.filter((_, i) => i !== index));

  const handleMouseDown = (e, column) => {
    setResizing({ column, startX: e.clientX, startWidth: columnWidths[column] });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!resizing) return;
      const newWidth = Math.max(50, resizing.startWidth + (e.clientX - resizing.startX));
      setColumnWidths(prev => ({ ...prev, [resizing.column]: newWidth }));
    };
    const handleMouseUp = () => setResizing(null);
    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizing]);

  const HEADERS = ['contentId', 'provider', 'contentType', 'keywords', 'rating', 'duration(sec)',
    'yearOfRelease', 'landscape', 'portrait', 'languages', 'summary', 'title', 'filename',
    'actor', 'director', 'genres', 'audioLanguages', 'isHd', 'expiryDate'];

  const DATA_KEYS = ['contentId', 'provider', 'contentType', 'keywords', 'rating', 'duration',
    'yearOfRelease', 'landscape', 'portrait', 'languages', 'summary', 'title', 'filename',
    'actor', 'director', 'genres', 'audioLanguages', 'isHd', 'expiryDate'];

  const exportToCSV = () => {
    if (contentData.length === 0) return alert('No data to export');

    const csvRows = [HEADERS.join(',')];
    contentData.forEach(row => {
      const values = DATA_KEYS.map(h => '"' + (row[h] || '').toString().replace(/"/g, '""') + '"');
      csvRows.push(values.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'content_bulk_' + Date.now() + '.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToXLSX = () => {
    if (contentData.length === 0) return alert('No data to export');

    let xml = '<?xml version="1.0"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n<Worksheet ss:Name="Content">\n<Table>\n<Row>\n';
    HEADERS.forEach(h => xml += '<Cell><Data ss:Type="String">' + h + '</Data></Cell>');
    xml += '</Row>\n';
    contentData.forEach(row => {
      xml += '<Row>';
      DATA_KEYS.forEach(h => {
        const v = (row[h] || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        xml += '<Cell><Data ss:Type="String">' + v + '</Data></Cell>';
      });
      xml += '</Row>\n';
    });
    xml += '</Table></Worksheet></Workbook>';
    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'content_bulk_' + Date.now() + '.xls';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (tableRef.current) {
      setTableScrollWidth(tableRef.current.scrollWidth);
    }
  }, [contentData, columnWidths]);

  const handleTopScroll = (e) => {
    if (isSyncingScroll.current) { isSyncingScroll.current = false; return; }
    if (bottomScrollRef.current) {
      isSyncingScroll.current = true;
      bottomScrollRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  const handleBottomScroll = (e) => {
    if (isSyncingScroll.current) { isSyncingScroll.current = false; return; }
    if (topScrollRef.current) {
      isSyncingScroll.current = true;
      topScrollRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  const renderResizer = (column) => (
    <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 z-10"
      onMouseDown={(e) => handleMouseDown(e, column)} />
  );

  const TableHeader = ({ column, label }) => (
    <th className="border border-gray-300 px-2 py-2 text-left font-semibold relative" style={{ width: columnWidths[column] + 'px' }}>
      {label}{renderResizer(column)}
    </th>
  );

  const TableCell = ({ index, field, value }) => {
    const isEditing = editingCell.index === index && editingCell.field === field;
    if (isEditing) {
      return (
        <td className="border border-gray-300 px-2 py-1" style={{ width: columnWidths[field] + 'px' }}>
          <input type="text" value={editingCell.value}
            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') saveCellEdit(); else if (e.key === 'Escape') cancelCellEdit(); }}
            onBlur={saveCellEdit} autoFocus
            className="w-full px-1 py-1 border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={field === 'duration' ? 'Seconds' : ''} />
        </td>
      );
    }
    return (
      <td className="border border-gray-300 px-2 py-1 cursor-pointer hover:bg-gray-100"
        style={{ width: columnWidths[field] + 'px', maxWidth: columnWidths[field] + 'px', height: '36px' }}
        onClick={() => startCellEdit(index, field, value)}
        title={value || ''}>
        <div className="px-1 py-1 truncate whitespace-nowrap overflow-hidden">{value || ''}</div>
      </td>
    );
  };

  const GridView = () => (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">All Saved Sheets</h1>
          <button onClick={() => setViewMode('form')}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
            Back to Form
          </button>
        </div>

        {savedSheets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No saved sheets yet</p>
            <button onClick={() => setViewMode('form')}
              className="mt-4 bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition">
              Create Your First Sheet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedSheets.map((sheet) => (
              <div key={sheet.name} onClick={() => loadSheet(sheet.name)}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800 break-words flex-1">{sheet.name}</h3>
                    <button onClick={(e) => deleteSheet(sheet.name, e)}
                      className="text-red-600 hover:text-red-800 ml-2" title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Items:</span>
                      <span className="font-semibold text-gray-800">{sheet.data.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Last Modified:</span>
                      <span className="font-semibold text-gray-800">
                        {new Date(sheet.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition">
                      Open Sheet
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (viewMode === 'grid') return <GridView />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Bulk Content Manager</h1>
          <div className="flex gap-2">
            <button onClick={createNewSheet}
              className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition flex items-center gap-2">
              <Plus size={18} />New Sheet
            </button>
            <button onClick={() => setViewMode('grid')}
              className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition flex items-center gap-2">
              <Grid size={18} />View All Sheets
            </button>
            <div className="relative">
              <button onClick={() => setShowSheetMenu(!showSheetMenu)}
                className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition">
                Saved Sheets ({savedSheets.length})
              </button>
              {showSheetMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-2">
                    <button onClick={createNewSheet}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded flex items-center gap-2 text-blue-600 font-medium">
                      <Plus size={16} />Create New Sheet
                    </button>
                    {savedSheets.length > 0 && (
                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <div className="text-xs text-gray-500 px-3 py-1 font-medium">SAVED SHEETS</div>
                        {savedSheets.map((sheet) => (
                          <div key={sheet.name} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded group">
                            <button onClick={() => loadSheet(sheet.name)} className="flex-1 text-left text-sm">
                              <div className="font-medium text-gray-800">{sheet.name}</div>
                              <div className="text-xs text-gray-500">{sheet.data.length} items</div>
                            </button>
                            <button onClick={(e) => deleteSheet(sheet.name, e)}
                              className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {currentSheetName && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-4 flex items-center justify-between">
            {isEditingName ? (
              <div className="flex items-center gap-2 flex-1">
                <input type="text" value={editedSheetName}
                  onChange={(e) => setEditedSheetName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveSheetName(); if (e.key === 'Escape') cancelEditingName(); }}
                  className="flex-1 px-3 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus />
                <button onClick={saveSheetName} className="text-green-600 hover:text-green-800" title="Save">
                  <Check size={20} />
                </button>
                <button onClick={cancelEditingName} className="text-red-600 hover:text-red-800" title="Cancel">
                  <X size={20} />
                </button>
              </div>
            ) : (
              <>
                <span className="text-sm text-blue-800">Current Sheet: <strong>{currentSheetName}</strong></span>
                <button onClick={startEditingSheetName}
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1" title="Edit">
                  <Edit2 size={16} /><span className="text-sm">Edit Name</span>
                </button>
              </>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Add New Bulk</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Content Mode</label>
            <div className="flex gap-2">
              <button onClick={() => handleModeChange('short_extended')}
                className={'py-2 px-4 rounded-md border text-sm font-medium transition ' + (contentMode === 'short_extended' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')}>
                Short &amp; Extended
              </button>
              <button onClick={() => handleModeChange('goals')}
                className={'py-2 px-4 rounded-md border text-sm font-medium transition ' + (contentMode === 'goals' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')}>
                Goals
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Switches the Extension and Summary Prefix defaults below. Everything stays editable either way.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Names List (comma separated)</label>
              <textarea value={namesList} onChange={(e) => setNamesList(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3" placeholder="Name 1, Name 2, Name 3, ..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Extension</label>
              <div className="flex gap-2">
                <input type="text" value={extensionPrefix} onChange={(e) => setExtensionPrefix(e.target.value)}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ShortMD" />
                <input type="text" value={mdNumber} onChange={(e) => setMdNumber(e.target.value)}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="1" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Will be appended as: {extensionPrefix}{mdNumber}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
              <input type="text" value={provider} onChange={(e) => setProvider(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
              <input type="text" value={contentType} onChange={(e) => setContentType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
              <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
              <input type="text" value={rating} onChange={(e) => setRating(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (seconds)</label>
              <input type="number" value={durationSeconds} onChange={(e) => setDurationSeconds(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 5400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year of Release</label>
              <input type="text" value={yearOfRelease} onChange={(e) => setYearOfRelease(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Languages</label>
              <input type="text" value={languages} onChange={(e) => setLanguages(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Summary Prefix</label>
              <input type="text" value={summaryPrefix} onChange={(e) => setSummaryPrefix(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="MD09 Short H/L" />
              <p className="text-xs text-gray-500 mt-1">This will be added after each name</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Actor</label>
              <input type="text" value={actor} onChange={(e) => setActor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Director</label>
              <input type="text" value={director} onChange={(e) => setDirector(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Genres</label>
              <input type="text" value={genres} onChange={(e) => setGenres(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Audio Languages</label>
              <input type="text" value={audioLanguages} onChange={(e) => setAudioLanguages(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Is HD</label>
              <input type="text" value={isHd} onChange={(e) => setIsHd(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <button onClick={handleGenerate}
            className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition flex items-center justify-center gap-2">
            <Upload size={20} />Generate Bulk Content
          </button>
        </div>

        {contentData.length > 0 && (
          <div id="content-table-section" className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-700">Content Data ({contentData.length} items)</h2>
              <div className="flex gap-2">
                <button onClick={saveCurrentSheet}
                  className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition flex items-center gap-2">
                  <Save size={18} />Save Sheet
                </button>
                <button onClick={exportToCSV}
                  className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition flex items-center gap-2">
                  <Download size={18} />Export CSV
                </button>
                <button onClick={exportToXLSX}
                  className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition flex items-center gap-2">
                  <Download size={18} />Export XLSX
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-2">💡 Click any cell to edit. Press Enter to save, Escape to cancel. Drag borders to resize columns.</div>

            <div ref={topScrollRef} onScroll={handleTopScroll} className="overflow-x-auto overflow-y-hidden" style={{ height: '16px' }}>
              <div style={{ width: tableScrollWidth + 'px', height: '1px' }} />
            </div>

            <div ref={bottomScrollRef} onScroll={handleBottomScroll} className="overflow-x-auto">
              <table className="border-collapse text-sm" ref={tableRef} style={{ width: 'max-content', tableLayout: 'fixed' }}>
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-2 text-left font-semibold relative" style={{ width: columnWidths.actions + 'px' }}>
                      Actions{renderResizer('actions')}
                    </th>
                    <TableHeader column="contentId" label="Content ID" />
                    <TableHeader column="provider" label="Provider" />
                    <TableHeader column="contentType" label="Content Type" />
                    <TableHeader column="keywords" label="Keywords" />
                    <TableHeader column="rating" label="Rating" />
                    <TableHeader column="duration" label="Duration (sec)" />
                    <TableHeader column="yearOfRelease" label="Year" />
                    <TableHeader column="landscape" label="Landscape" />
                    <TableHeader column="portrait" label="Portrait" />
                    <TableHeader column="languages" label="Languages" />
                    <TableHeader column="summary" label="Summary" />
                    <TableHeader column="title" label="Title" />
                    <TableHeader column="filename" label="Filename" />
                    <TableHeader column="actor" label="Actor" />
                    <TableHeader column="director" label="Director" />
                    <TableHeader column="genres" label="Genres" />
                    <TableHeader column="audioLanguages" label="Audio Languages" />
                    <TableHeader column="isHd" label="Is HD" />
                    <TableHeader column="expiryDate" label="Expiry Date" />
                  </tr>
                </thead>
                <tbody>
                  {contentData.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-2 py-1" style={{ width: columnWidths.actions + 'px' }}>
                        <button onClick={() => handleDelete(index)}
                          className="text-red-600 hover:text-red-800" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </td>
                      <TableCell index={index} field="contentId" value={row.contentId} />
                      <TableCell index={index} field="provider" value={row.provider} />
                      <TableCell index={index} field="contentType" value={row.contentType} />
                      <TableCell index={index} field="keywords" value={row.keywords} />
                      <TableCell index={index} field="rating" value={row.rating} />
                      <TableCell index={index} field="duration" value={row.duration} />
                      <TableCell index={index} field="yearOfRelease" value={row.yearOfRelease} />
                      <TableCell index={index} field="landscape" value={row.landscape} />
                      <TableCell index={index} field="portrait" value={row.portrait} />
                      <TableCell index={index} field="languages" value={row.languages} />
                      <TableCell index={index} field="summary" value={row.summary} />
                      <TableCell index={index} field="title" value={row.title} />
                      <TableCell index={index} field="filename" value={row.filename} />
                      <TableCell index={index} field="actor" value={row.actor} />
                      <TableCell index={index} field="director" value={row.director} />
                      <TableCell index={index} field="genres" value={row.genres} />
                      <TableCell index={index} field="audioLanguages" value={row.audioLanguages} />
                      <TableCell index={index} field="isHd" value={row.isHd} />
                      <TableCell index={index} field="expiryDate" value={row.expiryDate} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition flex items-center justify-center gap-2">
              <Plus size={20} />Add New Bulk (Scroll to Top)
            </button>
          </div>
        )}

        {contentData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                <ImageIcon size={22} />Rename &amp; Download Images
              </h2>
              <div className="flex gap-2">
                <label className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition flex items-center gap-2 cursor-pointer">
                  <Upload size={18} />Upload Images
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                </label>
                {uploadedImages.length > 0 && (
                  <>
                    <button onClick={downloadAllAsZip}
                      className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition flex items-center gap-2">
                      <Archive size={18} />Download All (ZIP)
                    </button>
                    <button onClick={clearAllImages}
                      className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition flex items-center gap-2">
                      <Trash2 size={18} />Clear All
                    </button>
                  </>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Upload images like "1 vs 2 Extended 1920*1080.jpg". Each image is matched to a match name by text, and to Short/Extended by keyword in the filename (or pick it manually if it's not detected). Orientation comes from the resolution in the filename — wider-than-tall becomes ..._Landscape.jpg, taller-than-wide becomes ..._Portrait.jpg.
            </p>

            {uploadedImages.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center text-gray-400">
                No images uploaded yet
              </div>
            ) : (
              <div className="space-y-3">
                {uploadedImages.map((img) => {
                  const availableVersions = img.matchedName ? getAvailableVersions(img.matchedName) : new Set();
                  const hasShort = availableVersions.has('Short') || availableVersions.has('Other');
                  const hasExtended = availableVersions.has('Extended') || availableVersions.has('Other');
                  const liveFileName = computeNewFileName(img.matchedName, img.version, img.orientation);
                  return (
                    <div key={img.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start gap-4 flex-wrap">
                        <img src={img.previewUrl} alt={img.originalName}
                          className="w-20 h-20 object-contain rounded border border-gray-200 bg-gray-50 flex-shrink-0" />

                        <div className="flex-1 min-w-[200px]">
                          <div className="text-sm font-medium text-gray-800 break-words">{img.originalName}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {img.width && img.height ? img.width + ' x ' + img.height : 'Unknown size'}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => downloadImage(img)} disabled={!liveFileName}
                            className={'p-2 rounded-md ' + (liveFileName ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-300 cursor-not-allowed')}
                            title="Download">
                            <Download size={18} />
                          </button>
                          <button onClick={() => removeImage(img.id)}
                            className="p-2 rounded-md text-red-600 hover:bg-red-50" title="Remove">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap mt-3">
                        <select value={img.matchedName || ''}
                          onChange={(e) => updateImageOverride(img.id, 'matchedName', e.target.value === '' ? null : e.target.value)}
                          className="text-sm px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="">No match</option>
                          {getUniqueMatchNames().map((name) => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1">
                          <button onClick={() => hasShort && updateImageOverride(img.id, 'version', 'Short')}
                            disabled={!hasShort}
                            title={hasShort ? '' : 'No Short version generated for this match'}
                            className={'text-xs px-2 py-1 rounded-md border ' + (!hasShort ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed' : img.version === 'Short' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-300')}>
                            Short
                          </button>
                          <button onClick={() => hasExtended && updateImageOverride(img.id, 'version', 'Extended')}
                            disabled={!hasExtended}
                            title={hasExtended ? '' : 'No Extended version generated for this match'}
                            className={'text-xs px-2 py-1 rounded-md border ' + (!hasExtended ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed' : img.version === 'Extended' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-300')}>
                            Extended
                          </button>
                        </div>

                        <button onClick={() => updateImageOverride(img.id, 'orientation', 'Landscape')}
                          className={'text-xs px-2 py-1 rounded-md border ' + (img.orientation === 'Landscape' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300')}>
                          Landscape
                        </button>
                        <button onClick={() => updateImageOverride(img.id, 'orientation', 'Portrait')}
                          className={'text-xs px-2 py-1 rounded-md border ' + (img.orientation === 'Portrait' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300')}>
                          Portrait
                        </button>
                      </div>

                      <div className="mt-2">
                        {liveFileName ? (
                          <div className="text-sm text-green-700 font-medium break-words">✓ {liveFileName}</div>
                        ) : img.matchedName ? (
                          <div className="text-sm text-red-600 font-medium">
                            No {img.version || 'matching'} version found for "{img.matchedName}" — pick an available option above
                          </div>
                        ) : (
                          <div className="text-sm text-red-600 font-medium">No match — select a match name above</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkContentManager;