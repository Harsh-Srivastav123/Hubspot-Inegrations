import { useState } from 'react';
import {
    Grid,
    Box,
    Typography,
    CircularProgress,
    Paper,
    Button
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import ContactCard from './ContactCard';
import ContactDialog from './ContactDialog';
import { deleteContact } from '../utils/api';

const ContactsList = ({ 
    contacts, 
    isLoading, 
    credentials,
    onRefresh 
}) => {
    const [selectedContact, setSelectedContact] = useState(null);
    const [showDialog, setShowDialog] = useState(false);
    // const [error, setError] = useState(null);    

    const handleEdit = (contact) => {
        setSelectedContact(contact);
        setShowDialog(true);
    };

    const handleDelete = async (contactId) => {
        if (window.confirm('Are you sure you want to delete this contact?')) {
            try {
                await deleteContact({
                    credentials,
                    contactId,
                    setError
                });
                onRefresh();
            } catch (err) {
                setError(err.message);
            }
        }
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" sx={{ my: 4 }}>
                <CircularProgress sx={{ color: '#ff7a59' }} />
            </Box>
        );
    }

    return (
        <>
            <Box display="flex" justifyContent="space-between" sx={{ mb: 3 }}>
                <Typography variant="h5">
                    Contacts ({contacts.length})
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        setSelectedContact(null);
                        setShowDialog(true);
                    }}
                >
                    Add Contact
                </Button>
            </Box>

            {!contacts.length ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h6" color="textSecondary">
                        No contacts found
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {contacts.map((contact) => (
                        <Grid item xs={12} sm={6} md={4} key={contact.id}>
                            <ContactCard
                                contact={contact}
                                credentials={credentials}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        </Grid>
                    ))}
                </Grid>
            )}

            <ContactDialog
                open={showDialog}
                onClose={() => setShowDialog(false)}
                contact={selectedContact}
                credentials={credentials}
                onSuccess={() => {
                    setShowDialog(false);
                    onRefresh();
                }}
            />
        </>
    );
};

export default ContactsList;