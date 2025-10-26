import React, { useState, useRef, useEffect } from 'react';
import { Download, Plus, Trash2, Upload, Save, Grid, Edit2, Check, X } from 'lucide-react';

const BulkContentManager = () => {
  const [namesList, setNamesList] = useState('');
  const [extension, setExtension] = useState('');
  const [provider, setProvider] = useState('');
  const [contentType, setContentType] = useState('');
  const [keywords, setKeywords] = useState('');
  const [rating, setRating] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [yearOfRelease, setYearOfRelease] = useState('');
  const [languages, setLanguages] = useState('');
  const [summaryPrefix, setSummaryPrefix] = useState('');
  const [actor, setActor] = useState('');
  const [director, setDirector] = useState('');
  const [genres, setGenres] = useState('');
  const [audioLanguages, setAudioLanguages] = useState('');
  const [isHd, setIsHd] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
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

  // Load saved sheets from localStorage on mount
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

  // Save sheets to localStorage whenever they change
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

  const minutesToSeconds = (minutes) => {
    const mins = parseFloat(minutes);
    return isNaN(mins) ? '' : Math.round(mins * 60);
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
    if (!extension) return alert('Please enter an extension');

    const newData = names.map(name => {
      const contentId = generateContentId(name, extension);
      const summary = name + summaryPrefix;
      return {
        contentId, provider, contentType, keywords, rating,
        duration: minutesToSeconds(durationMinutes), yearOfRelease,
        landscape: contentId + '_Landscape.jpg',
        portrait: contentId + '_Portrait.jpg',
        languages, summary, title: summary, filename: contentId + '.mp4',
        actor, director, genres, audioLanguages, isHd,
        expiryDate: expiryDate ? formatDate(expiryDate) : '', originalName: name
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
      if (editingCell.field === 'duration') {
        const numValue = parseFloat(editingCell.value);
        if (!isNaN(numValue) && numValue > 0) {
          updated[editingCell.index][editingCell.field] = numValue < 1000 ? Math.round(numValue * 60) : Math.round(numValue);
        } else {
          updated[editingCell.index][editingCell.field] = editingCell.value;
        }
      } else {
        updated[editingCell.index][editingCell.field] = editingCell.value;
      }
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

  const exportToCSV = () => {
    if (contentData.length === 0) return alert('No data to export');
    const headers = ['contentId', 'provider', 'contentType', 'keywords', 'rating', 'duration(sec)',
      'yearOfRelease', 'landscape', 'portrait', 'languages', 'summary', 'title', 'filename',
      'actor', 'director', 'genres', 'audioLanguages', 'isHd', 'expiryDate'];
    const dataKeys = ['contentId', 'provider', 'contentType', 'keywords', 'rating', 'duration',
      'yearOfRelease', 'landscape', 'portrait', 'languages', 'summary', 'title', 'filename',
      'actor', 'director', 'genres', 'audioLanguages', 'isHd', 'expiryDate'];
    const csvRows = [headers.join(',')];
    contentData.forEach(row => {
      const values = dataKeys.map(h => '"' + (row[h] || '').toString().replace(/"/g, '""') + '"');
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
    const headers = ['contentId', 'provider', 'contentType', 'keywords', 'rating', 'duration(sec)',
      'yearOfRelease', 'landscape', 'portrait', 'languages', 'summary', 'title', 'filename',
      'actor', 'director', 'genres', 'audioLanguages', 'isHd', 'expiryDate'];
    const dataKeys = ['contentId', 'provider', 'contentType', 'keywords', 'rating', 'duration',
      'yearOfRelease', 'landscape', 'portrait', 'languages', 'summary', 'title', 'filename',
      'actor', 'director', 'genres', 'audioLanguages', 'isHd', 'expiryDate'];
    let xml = '<?xml version="1.0"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n<Worksheet ss:Name="Content">\n<Table>\n<Row>\n';
    headers.forEach(h => xml += '<Cell><Data ss:Type="String">' + h + '</Data></Cell>');
    xml += '</Row>\n';
    contentData.forEach(row => {
      xml += '<Row>';
      dataKeys.forEach(h => {
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
            placeholder={field === 'duration' ? 'Minutes, press Enter' : ''} />
        </td>
      );
    }
    return (
      <td className="border border-gray-300 px-2 py-1 cursor-pointer hover:bg-gray-100"
        style={{ width: columnWidths[field] + 'px' }}
        onClick={() => startCellEdit(index, field, value)}>
        <div className="px-1 py-1">{value || ''}</div>
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Add New Bulk</h2>
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
              <input type="text" value={extension} onChange={(e) => setExtension(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="short" />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Converts to seconds" />
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

            <div className="overflow-x-auto">
              <table className="border-collapse text-sm" ref={tableRef} style={{ width: 'max-content' }}>
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
      </div>
    </div>
  );
};

export default BulkContentManager;