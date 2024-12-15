import {
    Add as AddIcon,
    Logout as LogoutIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { AppBar, Box, Button, Container, IconButton, Toolbar, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import ContactDialog from '../components/ContactDialog';
import ContactsList from '../components/ContactsList';
import SearchBar from '../components/SearchBar';
import { fetchContacts, handleLogout } from '../utils/api';

const ContactsScreen = ({ 
    user, 
    org, 
    integrationParams, 
    setIntegrationParams,
    setIsConnected 
}) => {
    const [contacts, setContacts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({});
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchContacts({
            credentials: integrationParams.credentials,
            setContacts,
            setIsLoading,
            setError
        });
    }, [integrationParams.credentials]);

    // const filteredContacts = filterContacts(
    //     searchContacts(contacts, searchQuery),
    //     filters
    // );

    // console.log('CONTACTS:++++++++ ', contacts)

    return (
        <Box sx={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#f5f5f5',
            zIndex: 1000 
        }}>
            <AppBar position="static" sx={{ backgroundColor: '#ff7a59' }}>
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        HubSpot Contacts
                    </Typography>
                    <SearchBar 
                        value={searchQuery}
                        onChange={setSearchQuery}
                        filters={filters}
                        onFilterChange={setFilters}
                    />
                    <Button
                        color="inherit"
                        startIcon={<AddIcon />}
                        onClick={() => setShowCreateDialog(true)}
                        sx={{ ml: 2 }}
                    >
                        Add Contact
                    </Button>
                    <Button
                        color="inherit"
                        startIcon={<RefreshIcon />}
                        onClick={() => fetchContacts({
                            credentials: integrationParams.credentials,
                            setContacts,
                            setIsLoading,
                            setError
                        })}
                        disabled={isLoading}
                        sx={{ ml: 1 }}
                    >
                        Refresh
                    </Button>
                    <IconButton 
                        color="inherit" 
                        onClick={() => handleLogout({
                            user,
                            org,
                            setIsConnected,
                            setIntegrationParams
                        })}
                        sx={{ ml: 1 }}
                        title="Logout"
                    >
                        <LogoutIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <ContactsList 
                    contacts={contacts}
                    isLoading={isLoading}
                    credentials={integrationParams.credentials}
                    onRefresh={() => fetchContacts({
                        credentials: integrationParams.credentials,
                        setContacts,
                        setIsLoading,
                        setError
                    })}
                />
                <ContactDialog 
                    open={showCreateDialog}
                    onClose={() => setShowCreateDialog(false)}
                    credentials={integrationParams.credentials}
                    onSuccess={() => {
                        setShowCreateDialog(false);
                        fetchContacts({
                            credentials: integrationParams.credentials,
                            setContacts,
                            setIsLoading,
                            setError
                        });
                    }}
                />
            </Container>
            {error && <div style={{ color: 'red' }}>{error}</div>}
        </Box>
    );
};

export default ContactsScreen;