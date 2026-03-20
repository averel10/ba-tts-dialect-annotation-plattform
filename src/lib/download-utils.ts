interface FilterParams {
  speakerId?: string;
  modelName?: string;
  dialect?: string;
  iteration?: number | string;
  utteranceId?: string;
}

export async function downloadFilteredEntriesAsZip(
  datasetId: number,
  filters: FilterParams
) {
  try {
    const response = await fetch('/api/download-filtered-entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        datasetId,
        filters,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to prepare ZIP');
    }

    const data = await response.json();
    
    if (!data.success || !data.downloadUrl) {
      throw new Error('Invalid response from server');
    }

    // Redirect to the generated ZIP file
    window.location.href = data.downloadUrl;
  } catch (error) {
    console.error('Error downloading ZIP:', error);
    throw error;
  }
}

export async function downloadFilteredEntriesAsCsv(
  datasetId: number,
  filters: FilterParams
) {
  try {
    const response = await fetch('/api/download-metadata-csv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        datasetId,
        filters,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to download CSV');
    }

    // Get the CSV blob from response
    const blob = await response.blob();

    // Trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dataset-${datasetId}-metadata-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading CSV:', error);
    throw error;
  }
}
