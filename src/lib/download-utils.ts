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
      throw new Error(errorData.error || 'Failed to download ZIP');
    }

    // Get the ZIP blob from response
    const blob = await response.blob();

    // Trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dataset-${datasetId}-export-${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading ZIP:', error);
    throw error;
  }
}
