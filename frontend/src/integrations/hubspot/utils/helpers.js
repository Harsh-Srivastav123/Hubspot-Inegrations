// File size formatting
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Date formatting
export const formatDate = (dateString) => {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

// Contact name formatting
export const formatContactName = (contact) => {
    const firstName = contact.firstname || '';
    const lastName = contact.lastname || '';
    if (!firstName && !lastName) return 'No Name';
    return `${firstName} ${lastName}`.trim();
};

// Email validation
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Phone number formatting
export const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';
    
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Format based on length
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
    }
    return phoneNumber;
};

// File type validation
export const isAllowedFileType = (filename) => {
    const allowedExtensions = [
        'pdf', 'doc', 'docx', 'xls', 'xlsx',
        'jpg', 'jpeg', 'png', 'gif'
    ];
    const extension = filename.split('.').pop().toLowerCase();
    return allowedExtensions.includes(extension);
};

// File size validation (in bytes)
export const isAllowedFileSize = (fileSize, maxSize = 10 * 1024 * 1024) => { // Default 10MB
    return fileSize <= maxSize;
};

// Search and filter helpers
export const filterContacts = (contacts, filters) => {
    return contacts.filter(contact => {
        if (filters.hasEmail && !contact.email) return false;
        if (filters.hasPhone && !contact.phone) return false;
        if (filters.hasCompany && !contact.company) return false;
        if (filters.dateRange) {
            const contactDate = new Date(contact.createDate);
            if (contactDate < filters.dateRange.start || 
                contactDate > filters.dateRange.end) {
                return false;
            }
        }
        return true;
    });
};

export const searchContacts = (contacts, query) => {
    if (!query) return contacts;
    
    const searchTerms = query.toLowerCase().split(' ');
    return contacts.filter(contact => {
        const searchableText = [
            contact.firstname,
            contact.lastname,
            contact.email,
            contact.company,
            contact.phone
        ].join(' ').toLowerCase();
        
        return searchTerms.every(term => searchableText.includes(term));
    });
};

// Error message formatting
export const formatErrorMessage = (error) => {
    if (typeof error === 'string') return error;
    if (error.response?.data?.detail) return error.response.data.detail;
    if (error.message) return error.message;
    return 'An unexpected error occurred';
};

// Credential helpers
export const isTokenExpired = (credentials) => {
    if (!credentials?.expires_at) return true;
    
    // Add 5-minute buffer
    const expirationTime = new Date(credentials.expires_at).getTime() - (5 * 60 * 1000);
    return Date.now() >= expirationTime;
};

// Data transformation helpers
export const transformContactData = (contact) => {
    return {
        id: contact.id,
        firstname: contact.properties?.firstname || '',
        lastname: contact.properties?.lastname || '',
        email: contact.properties?.email || '',
        phone: contact.properties?.phone || '',
        company: contact.properties?.company || '',
        createDate: contact.properties?.createdate || '',
        lastModifiedDate: contact.properties?.lastmodifieddate || '',
        notes: contact.properties?.notes || ''
    };
};

// Pagination helpers
export const paginateResults = (items, page = 1, pageSize = 10) => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return {
        items: items.slice(startIndex, endIndex),
        totalPages: Math.ceil(items.length / pageSize),
        currentPage: page,
        hasMore: endIndex < items.length
    };
};

// Sort helpers
export const sortContacts = (contacts, sortField, sortDirection = 'asc') => {
    return [...contacts].sort((a, b) => {
        let valueA = a[sortField] || '';
        let valueB = b[sortField] || '';
        
        // Handle case-insensitive string comparison
        if (typeof valueA === 'string') valueA = valueA.toLowerCase();
        if (typeof valueB === 'string') valueB = valueB.toLowerCase();
        
        if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
};

// Local storage helpers
export const storageKeys = {
    FILTERS: 'hubspot_filters',
    SORT_PREFERENCES: 'hubspot_sort_preferences',
    PAGE_SIZE: 'hubspot_page_size'
};

export const saveToLocalStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
};

export const getFromLocalStorage = (key, defaultValue = null) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
};

// Debug helpers
export const debugLog = (message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[HubSpot Integration] ${message}`, data || '');
    }
};