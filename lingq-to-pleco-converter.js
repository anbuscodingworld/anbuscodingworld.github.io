import React, { useState } from 'react';
import { Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';

const LingQToPlecoConverter = () => {
  const [csvData, setCsvData] = useState('');
  const [status, setStatus] = useState('');
  const [convertedXml, setConvertedXml] = useState('');
  const [error, setError] = useState('');

  const parseCSV = (csv) => {
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    const cards = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      // Handle CSV parsing with quoted fields
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current);

      if (values.length >= 4) {
        cards.push({
          term: values[0]?.trim() || '',
          phrase: values[1]?.trim() || '',
          language: values[2]?.trim() || '',
          meaning: values[3]?.trim() || ''
        });
      }
    }
    
    return cards;
  };

  const escapeXml = (text) => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const convertToPleco = (cards) => {
    const timestamp = Math.floor(Date.now() / 1000);
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<plecoflash formatversion="2" creator="LingQ Import" generator="LingQ to Pleco Converter" platform="Web" created="${timestamp}">
<cards>`;

    cards.forEach((card) => {
      if (!card.term) return;

      xml += `
<card language="chinese">
<entry>
<headword charset="sc">${escapeXml(card.term)}</headword>`;

      // Add definition
      if (card.meaning) {
        xml += `
<defn>${escapeXml(card.meaning)}</defn>`;
      }

      xml += `
</entry>`;

      // Add category based on language
      if (card.language) {
        xml += `
<catassign category="LingQ Import"/>`;
      }

      xml += `
</card>`;
    });

    xml += `
</cards>
</plecoflash>`;

    return xml;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      setCsvData(text);
      setError('');
      setStatus('');
    };
    reader.readAsText(file);
  };

  const handleConvert = () => {
    try {
      if (!csvData) {
        setError('Please upload a CSV file first');
        return;
      }

      setStatus('Converting...');
      const cards = parseCSV(csvData);
      
      if (cards.length === 0) {
        setError('No valid cards found in CSV');
        setStatus('');
        return;
      }

      const xml = convertToPleco(cards);
      setConvertedXml(xml);
      setStatus(`Successfully converted ${cards.length} cards!`);
      setError('');
    } catch (err) {
      setError(`Conversion error: ${err.message}`);
      setStatus('');
    }
  };

  const handleDownload = () => {
    if (!convertedXml) return;

    const blob = new Blob([convertedXml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lingq-to-pleco.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">LingQ to Pleco Converter</h1>
      
      <div className="space-y-6">
        {/* Upload Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="mx-auto mb-4 text-gray-400" size={48} />
          <label className="cursor-pointer">
            <span className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 inline-block">
              Choose CSV File
            </span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          {csvData && (
            <p className="mt-4 text-sm text-green-600">
              <CheckCircle className="inline mr-2" size={16} />
              File loaded successfully
            </p>
          )}
        </div>

        {/* Convert Button */}
        <button
          onClick={handleConvert}
          disabled={!csvData}
          className="w-full bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold text-lg"
        >
          Convert to Pleco Format
        </button>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="text-red-500 mr-2 flex-shrink-0" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {status && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
            <CheckCircle className="text-green-500 mr-2 flex-shrink-0" size={20} />
            <p className="text-green-700">{status}</p>
          </div>
        )}

        {/* Download Section */}
        {convertedXml && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Conversion Complete!</h2>
            <button
              onClick={handleDownload}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 flex items-center justify-center w-full font-semibold"
            >
              <Download className="mr-2" size={20} />
              Download Pleco XML File
            </button>
            <p className="mt-4 text-sm text-gray-600">
              Import this XML file into Pleco using: Settings → Flashcards → Import Cards
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-3">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Upload your LingQ CSV file</li>
            <li>Click "Convert to Pleco Format"</li>
            <li>Download the generated XML file</li>
            <li>Import into Pleco: Settings → Flashcards → Import Cards</li>
          </ol>
          <p className="mt-4 text-xs text-blue-700">
            <strong>Note:</strong> Pinyin pronunciation data is not included in LingQ exports. 
            You may need to add pinyin manually in Pleco after importing, or the app may auto-generate it.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LingQToPlecoConverter;