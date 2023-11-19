import React, { useState } from 'react';
import Select from 'react-select';
import './App.css';

const QueryInterface = () => {
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [searchType, setSearchType] = useState('direct'); 
  const [logs, setLogs] = useState([]);
  const [filterNames, setFilterNames] = useState([]);
  const [searchClicked, setSearchClicked] = useState(false);


  const filterOptions = [
    { value: 'Level', label: 'Level' },
    { value: 'Message', label: 'Message' },
    { value: 'ResourceId', label: 'ResourceId' },
    { value: 'TimeStamp', label: 'TimeStamp' },
    { value: 'TraceId', label: 'TraceId' },
    { value: 'SpanId', label: 'SpanId' },
    { value: 'Commit', label: 'Commit' },
    { value: 'Metadata.parentResourceId', label: 'Metadata.parentResourceId' },
  ];

  const searchTypeOptions = [
    { value: 'direct', label: 'Direct search' },
    { value: 'range', label: 'Range search' },
  ];

  const handleFilterChange = (selectedOption) => {
    setSelectedFilter(selectedOption);
  };

  const handleSearchInputChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleStartTimeChange = (event) => {
    setStartTime(event.target.value);
  };

  const handleEndTimeChange = (event) => {
    setEndTime(event.target.value);
  };

  const handleSearchTypeChange = (selectedOption) => {
    setSearchType(selectedOption.value);
  };

  function convertToISOString(timestampString) {
    const date = new Date(timestampString);
    const isoTimestamp = date.toISOString();

    return isoTimestamp;
  }



  const handleSearch = async () => {
    try {
      setSearchClicked(true);
      let requestBody;

      if (selectedFilter.value === 'TimeStamp') {
        if (searchType === 'direct') {
          requestBody = {
            [selectedFilter.value]: searchQuery,
            rangeSearch: false,  
          };
        } else {
          requestBody = {
            [selectedFilter.value]: { startTime, endTime },
            rangeSearch: true,  
          };
        }
      } else {
        requestBody = {
          [selectedFilter.value]: searchQuery,
        };
      }

      console.log("Request body", requestBody);

      const response = await fetch('http://localhost:3000/query_logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Parse the response as JSON
      const result = await response.json();

      if (result.logs.length > 0) {
        const filterNameMapping = ['Id', 'Level', 'Message', 'ResourceId', 'TimeStamp', 'TraceId', 'SpanId', 'Commit', 'Metadata.parentResourceId'];
        setLogs(result.logs.map(log => {
          const timestampIndex = 4;

          return {
            ...log,
            timestamp: convertToISOString(log[timestampIndex]),
          };
        }));

        setFilterNames(filterNameMapping);
      } else{
        setLogs([]);
        setFilterNames([]);
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  };


  return (
    <div>
      <h1>Query Interface</h1>
      <Select
        options={filterOptions}
        onChange={handleFilterChange}
        placeholder="Select a filter..."
      />
      {selectedFilter && (
        <div>
          {selectedFilter.value === 'TimeStamp' ? (
            <div className='select-container'>
              <Select
                options={searchTypeOptions}
                onChange={handleSearchTypeChange}
                placeholder="Select search type..."
              />
              {searchType === 'range' ? (
                <div className="input-container">
                  <label className='startname_style'>Start Time:</label>
                  <input
                    type="text"
                    value={startTime}
                    onChange={handleStartTimeChange}
                    className="start-time-input"
                  />
                  <label className='endname_style'>End Time:</label>
                  <input
                    type="text"
                    value={endTime}
                    onChange={handleEndTimeChange}
                    className="end-time-input"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  className='filter-input'
                />
              )}
            </div>
          ) : (
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInputChange}
              placeholder={`Enter ${selectedFilter.label}...`}
            />
          )}
          <button onClick={handleSearch}>Search</button>
        </div>
      )}
      {logs.length > 0 ? (
        <table>
          <thead>
            <tr>
              {filterNames.map((filterName, index) => (
                <th key={index}>{filterName}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((log, rowIndex) => (
              <tr key={rowIndex}>
                {filterNames.map((filterName, cellIndex) => (
                  <td key={cellIndex}>
                    {filterName === 'TimeStamp'
                      ? new Date(log[cellIndex]).toISOString()
                      : log[cellIndex]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        searchClicked && logs.length === 0 && <p className="no-logs-message">No logs found</p>
      )}
    </div>
  );
};

export default QueryInterface;
