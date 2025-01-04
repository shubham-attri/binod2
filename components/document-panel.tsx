const fetchDocuments = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('No auth token found');
      return;
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/documents/list`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      setDocuments(data);
    } else {
      const error = await response.json();
      console.error('Document fetch failed:', error);
    }
  } catch (error) {
    console.error('Failed to fetch documents:', error);
  }
}; 