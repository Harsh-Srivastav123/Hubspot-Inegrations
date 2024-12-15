import axios from 'axios';

const getApiBaseUrl = async () => {
  try {
    // First try localhost
    const response = await fetch('http://localhost:8000/health');
    if (response.status === 200) {
      return 'http://localhost:8000/integrations/hubspot';
    }
  } catch (error) {
    console.log('Local server not available, using production API');
  }
  // Fall back to production URL if localhost fails
  return 'https://9j03m9ro53.execute-api.ap-south-1.amazonaws.com/dev/integrations/hubspot';
};

const API_BASE_URL = await getApiBaseUrl();

// Error handler utility
const handleApiError = (error) => {
    // Handle axios error response
    if (error.response?.data?.detail) {
        return new Error(error.response.data.detail);
    }
    // Handle network errors 
    if (error.request) {
        return new Error('Network error occurred');
    }
    // Handle other errors
    return new Error(error.message || 'An unexpected error occurred');
};

// Authentication APIs
export const handleConnect = async ({
                                        user,
                                        org,
                                        setIsConnecting,
                                        setIntegrationParams,
                                        setError
                                    }) => {
    try {
        setIsConnecting(true);
        setError(null);

        const formData = new FormData();
        formData.append('user_id', user);
        formData.append('org_id', org);

        const response = await axios.post(
            `${API_BASE_URL}/authorize`,
            formData
        );

        const authURL = response?.data;
        const newWindow = window.open(
            authURL,
            'HubSpot Authorization',
            'width=600,height=600'
        );

        const pollTimer = window.setInterval(() => {
            if (newWindow?.closed) {
                window.clearInterval(pollTimer);
                handleWindowClosed({
                    user,
                    org,
                    setIsConnecting,
                    setIntegrationParams,
                    setError
                });
            }
        }, 200);
    } catch (error) {
        const err = handleApiError(error);
        setError(err.message);
        setIsConnecting(false);
    }
};

export const handleWindowClosed = async ({
                                             user,
                                             org,
                                             setIsConnecting,
                                             setIntegrationParams,
                                             setError
                                         }) => {
    try {
        const formData = new FormData();
        formData.append('user_id', user);
        formData.append('org_id', org);

        const response = await axios.post(
            `${API_BASE_URL}/credentials`,
            formData
        );

        const credentials = response.data;
        if (credentials) {
            setIntegrationParams(prev => ({
                ...prev,
                credentials,
                type: 'HubSpot'
            }));
            return true;
        }
        return false;
    } catch (error) {
        const err = handleApiError(error);
        setError(err.message);
        return false;
    } finally {
        setIsConnecting(false);
    }
};

// Contact Management APIs
export const fetchContacts = async ({
                                        credentials,
                                        setContacts,
                                        setIsLoading,
                                        setError
                                    }) => {
    try {
        setIsLoading(true);
        const formData = new FormData();
        formData.append('credentials', JSON.stringify(credentials));

        const response = await axios.post(
            `${API_BASE_URL}/load`,
            formData
        );
        setContacts(response.data);
    } catch (error) {
        const err = handleApiError(error);
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
};

export const createContact = async ({
                                        credentials,
                                        contactData,
                                        setError
                                    }) => {
    try {
        const formData = new FormData();
        formData.append('credentials', JSON.stringify(credentials));
        formData.append('contact_data', JSON.stringify(contactData));

        const response = await axios.post(
            `${API_BASE_URL}/contacts`,
            formData
        );

        return response.data;
    } catch (error) {
        const err = handleApiError(error);
        setError(err.message);
        return null;
    }
};

export const updateContact = async ({
                                        credentials,
                                        contactId,
                                        contactData,
                                        setError
                                    }) => {
    try {
        const formData = new FormData();
        formData.append('credentials', JSON.stringify(credentials));
        formData.append('contact_data', JSON.stringify(contactData));

        const response = await axios.patch(
            `${API_BASE_URL}/contacts/${contactId}`,
            formData
        );

        return response.data;
    } catch (error) {
        const err = handleApiError(error);
        setError(err.message);
        return null;
    }
};

export const deleteContact = async ({
                                        credentials,
                                        contactId,
                                        setError
                                    }) => {
    try {
        const formData = new FormData();
        formData.append('credentials', JSON.stringify(credentials));

        await axios.delete(
            `${API_BASE_URL}/contacts/${contactId}`,
            {data: formData}
        );

        return true;
    } catch (error) {
        const err = handleApiError(error);
        setError(err.message);
        return false;
    }
};

// File Management APIs
export const uploadContactFile = async ({
                                            credentials,
                                            contactId,
                                            file,
                                            setError,
                                            onProgress
                                        }) => {
    try {
        const formData = new FormData();
        formData.append('credentials', JSON.stringify(credentials));
        formData.append('file', file);

        const response = await axios.post(
            `${API_BASE_URL}/contacts/${contactId}/files`,
            formData,
            {
                onUploadProgress: (progressEvent) => {
                    if (onProgress) {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        onProgress(percentCompleted);
                    }
                }
            }
        );

        return response.data;
    } catch (error) {
        const err = handleApiError(error);
        setError(err.message);
        return null;
    }
};

export const getContactFiles = async ({
                                          credentials,
                                          contactId,
                                          setError
                                      }) => {
    try {
        const response = await axios.get(
            `${API_BASE_URL}/contacts/${contactId}/files`, {
                params: {
                    credentials: JSON.stringify(credentials)
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data || [];
    } catch (error) {
        const err = handleApiError(error);
        setError(err.message);
        return [];
    }
};

// Session Management
export const handleLogout = async ({
                                       user,
                                       org,
                                       setIsConnected,
                                       setIntegrationParams,
                                       setError
                                   }) => {
    try {
        const formData = new FormData();
        formData.append('user_id', user);
        formData.append('org_id', org);

        await axios.post(`${API_BASE_URL}/logout`, formData);

        setIsConnected(false);
        setIntegrationParams(prev => ({
            ...prev,
            credentials: null,
            type: null
        }));

        return true;
    } catch (error) {
        const err = handleApiError(error);
        setError(err.message);
        return false;
    }
};

// Search and Filter APIs
export const searchContacts = async ({
                                         credentials,
                                         query,
                                         filters = {},
                                         setError
                                     }) => {
    try {
        const formData = new FormData();
        formData.append('credentials', JSON.stringify(credentials));
        formData.append('query', query);
        formData.append('filters', JSON.stringify(filters));

        const response = await axios.post(
            `${API_BASE_URL}/search`,
            formData
        );

        return response.data;
    } catch (error) {
        const err = handleApiError(error);
        setError(err.message);
        return [];
    }
};

// Utility function to check if token needs refresh
export const checkCredentials = async ({
                                           credentials,
                                           setError
                                       }) => {
    try {
        const formData = new FormData();
        formData.append('credentials', JSON.stringify(credentials));

        const response = await axios.post(
            `${API_BASE_URL}/check-credentials`,
            formData
        );

        return response.data;
    } catch (error) {
        const err = handleApiError(error);
        setError(err.message);
        return null;
    }
};

export const getGptResponse = async ({
    credentials,
    contactId
}) => {
    try {

        const formData = new FormData();
        formData.append('credentials', JSON.stringify(credentials));
        formData.append('contact_id', JSON.stringify(contactId));

        const response = await axios.post(
            `${API_BASE_URL}/contacts/${contactId}/summarize`,
            formData
        );

        return response.data;

    } catch (error) {
        console.error(error);   
    } 
};